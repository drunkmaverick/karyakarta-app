import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '../../../../../lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { jobId, to } = await request.json();

    if (!jobId || !to) {
      return NextResponse.json(
        { ok: false, error: 'Job ID and status are required' },
        { status: 400 }
      );
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the ID token

    
    if (!auth) {

    
      return NextResponse.json(

    
        { ok: false, error: 'Authentication not available' },

    
        { status: 500 }

    
      );

    
    }

    
    

    
    let decodedToken;

    
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    // Get the job
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    
    if (!jobDoc.exists) {
      return NextResponse.json(
        { ok: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    const job = jobDoc.data()!;

    // Verify the provider is assigned to this job
    if (job.providerId !== userId) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - not assigned to this job' },
        { status: 403 }
      );
    }

    // Validate status transition
    const validTransitions: { [key: string]: string[] } = {
      'created': ['pending'],
      'pending': ['in_progress', 'canceled'],
      'in_progress': ['completed', 'failed'],
      'completed': [],
      'canceled': [],
      'failed': []
    };

    if (!validTransitions[job.status]?.includes(to)) {
      return NextResponse.json(
        { ok: false, error: `Invalid status transition from ${job.status} to ${to}` },
        { status: 400 }
      );
    }

    // Update job status
    await db.collection('jobs').doc(jobId).update({
      status: to,
      updatedAt: new Date()
    });

    // If job is completed, create a payout draft
    if (to === 'completed') {
      await createPayoutDraft(jobId, userId, job.amount, job.currency);
    }

    return NextResponse.json({
      ok: true,
      message: `Job status updated to ${to.replace('_', ' ')}`
    });

  } catch (error: any) {
    console.error('Error updating job status:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createPayoutDraft(jobId: string, providerId: string, amount: number, currency: string) {
  try {
    const payoutData = {
      jobId,
      providerId,
      amount: Number(amount),
      currency,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (db) {
      await db.collection('payouts').add(payoutData);
    }
    console.log(`Payout draft created for job ${jobId}`);
  } catch (error) {
    console.error('Error creating payout draft:', error);
    // Don't throw error as this is not critical for the main operation
  }
}

