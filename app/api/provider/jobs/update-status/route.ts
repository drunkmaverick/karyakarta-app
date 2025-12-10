import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../lib/firebaseAdmin';
import { requireProvider } from '../../../_lib/requireAuth';
import { UpdateJobStatusRequest, UpdateJobStatusResponse, JobDoc, PayoutDoc } from '../../../../../src/types/app';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse<UpdateJobStatusResponse>> {
  try {
    const authResult = await requireProvider(request);
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<UpdateJobStatusResponse>;
    }

    const { jobId, to }: UpdateJobStatusRequest = await request.json();

    // Validate required fields
    if (!jobId || !to) {
      return NextResponse.json(
        { ok: false, error: 'Job ID and status are required' },
        { status: 400 }
      );
    }

    if (!['accepted', 'in_progress', 'completed'].includes(to)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid status transition' },
        { status: 400 }
      );
    }

    const USE_MOCK = process.env.USE_MOCK === '1';
    
    if (USE_MOCK) {
      // Mock mode - return success
      return NextResponse.json({
        ok: true
      });
    }

    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    // Get the job document
    const jobRef = db.collection('jobs').doc(jobId);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      return NextResponse.json(
        { ok: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    const jobData = jobDoc.data() as JobDoc;

    // Validate job ownership
    if (jobData.providerId !== authResult.uid) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'pending': ['accepted'],
      'accepted': ['in_progress'],
      'in_progress': ['completed']
    };

    if (!validTransitions[jobData.status]?.includes(to)) {
      return NextResponse.json(
        { ok: false, error: `Invalid transition from ${jobData.status} to ${to}` },
        { status: 400 }
      );
    }

    // Update job status
    await jobRef.update({
      status: to,
      updatedAt: new Date()
    });

    // If job is completed, create payout draft
    if (to === 'completed') {
      // Check if payout already exists
      const existingPayoutQuery = await db.collection('payouts')
        .where('jobId', '==', jobId)
        .where('providerId', '==', authResult.uid)
        .limit(1)
        .get();

      if (existingPayoutQuery.empty) {
        const payoutData: Omit<PayoutDoc, 'createdAt' | 'updatedAt'> = {
          providerId: authResult.uid,
          jobId,
          amount: jobData.price,
          status: 'draft'
        };

        await db.collection('payouts').add({
          ...payoutData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Send rating notification to customer (optional, don't block on failure)
      try {
        const notificationData = {
          to: jobData.customerId,
          title: 'Rate Your Service',
          body: 'How was your service? Please rate your experience.',
          data: {
            type: 'rate_job',
            jobId: jobId,
            url: '/history/customer'
          }
        };

        // In mock mode, just log
        if (process.env.USE_MOCK === '1') {
          console.log('Mock notification:', notificationData);
        } else {
          // In real mode, send FCM notification
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'mock-admin-token'}`
            },
            body: JSON.stringify(notificationData)
          });
          
          if (!response.ok) {
            console.warn('Failed to send rating notification:', await response.text());
          }
        }
      } catch (notificationError) {
        console.warn('Error sending rating notification:', notificationError);
      }
    }

    return NextResponse.json({
      ok: true
    });

  } catch (error: any) {
    console.error('Error updating job status:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
