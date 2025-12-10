import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebaseAdmin';
import { requireCustomer } from '../../_lib/requireAuth';
import { RepeatJobRequest, RepeatJobResponse, JobDoc } from '../../../../src/types/app';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse<RepeatJobResponse>> {
  try {
    const authResult = await requireCustomer(request);
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<RepeatJobResponse>;
    }

    const { jobId, scheduledForISO }: RepeatJobRequest = await request.json();

    // Validate required fields
    if (!jobId) {
      return NextResponse.json(
        { ok: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const USE_MOCK = process.env.USE_MOCK === '1';
    
    if (USE_MOCK) {
      // Mock mode - return a mock job ID
      const mockJobId = `mock-repeat-job-${Date.now()}`;
      return NextResponse.json({
        ok: true,
        id: mockJobId
      });
    }

    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    // Get the original job document
    const originalJobRef = db.collection('jobs').doc(jobId);
    const originalJobDoc = await originalJobRef.get();

    if (!originalJobDoc.exists) {
      return NextResponse.json(
        { ok: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    const originalJobData = originalJobDoc.data() as JobDoc;

    // Validate job ownership
    if (originalJobData.customerId !== authResult.uid) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Create new job with same details but new status and optional new date
    const newScheduledFor = scheduledForISO ? new Date(scheduledForISO) : originalJobData.scheduledFor;
    
    const newJobData: Omit<JobDoc, 'createdAt' | 'updatedAt'> = {
      customerId: authResult.uid,
      status: 'pending',
      serviceType: originalJobData.serviceType,
      scheduledFor: newScheduledFor,
      address: originalJobData.address,
      notes: originalJobData.notes || '',
      price: originalJobData.price
    };

    const newJobRef = await db.collection('jobs').add({
      ...newJobData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      ok: true,
      id: newJobRef.id
    });

  } catch (error: any) {
    console.error('Error repeating job:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}