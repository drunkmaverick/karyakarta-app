import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebaseAdmin';
import { requireCustomer } from '../../_lib/requireAuth';
import { CreateJobRequest, CreateJobResponse, JobDoc } from '../../../../src/types/app';
import { paymentsEnabled } from '../../../../src/lib/flags';
import { trackBookingCreated, trackBookingConfirmed } from '../../../../src/lib/analytics';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse<CreateJobResponse>> {
  try {
    const authResult = await requireCustomer(request);
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<CreateJobResponse>;
    }

    const {
      serviceType,
      scheduledForISO,
      address,
      notes,
      price
    }: CreateJobRequest = await request.json();

    // Validate required fields
    if (!serviceType || !scheduledForISO || !address || price === undefined) {
      return NextResponse.json(
        { ok: false, error: 'Service type, scheduled time, address, and price are required' },
        { status: 400 }
      );
    }

    const USE_MOCK = process.env.USE_MOCK === '1';
    
    if (USE_MOCK) {
      // Mock mode - return a mock job ID
      const mockJobId = `mock-job-${Date.now()}`;
      return NextResponse.json({
        ok: true,
        id: mockJobId
      });
    }

    // Check database availability for non-mock mode
    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    // Create job document with new schema
    const jobData: Omit<JobDoc, 'createdAt' | 'updatedAt'> = {
      customerId: authResult.uid,
      status: paymentsEnabled ? 'pending' : 'confirmed', // Skip payment step when payments disabled
      serviceType,
      scheduledFor: new Date(scheduledForISO),
      address,
      notes: notes || '',
      price: Number(price)
    };

    const docRef = await db.collection('jobs').add({
      ...jobData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const customerRef = db.collection('customers').doc(authResult.uid);
    const customerDoc = await customerRef.get();

    if (!customerDoc.exists) {
      await customerRef.set({
        name: 'Customer', // Default name, should be updated via profile
        phone: '',
        email: authResult.email || '',
        area: '',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Track analytics events
    try {
      if (paymentsEnabled) {
        trackBookingCreated(docRef.id, serviceType, Number(price));
      } else {
        trackBookingConfirmed(docRef.id, serviceType, Number(price));
      }
    } catch (analyticsError) {
      console.error('Analytics tracking failed:', analyticsError);
      // Don't fail the booking if analytics fails
    }

    return NextResponse.json({
      ok: true,
      id: docRef.id
    });

  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}