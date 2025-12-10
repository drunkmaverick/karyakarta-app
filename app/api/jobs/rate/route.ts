import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebaseAdmin';
import { requireCustomer } from '../../_lib/requireAuth';
import { RateJobRequest, RateJobResponse, JobDoc, ProviderDoc } from '../../../../src/types/app';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse<RateJobResponse>> {
  try {
    const authResult = await requireCustomer(request);
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<RateJobResponse>;
    }

    const { jobId, score, comment }: RateJobRequest = await request.json();

    // Validate required fields
    if (!jobId || !score || score < 1 || score > 5) {
      return NextResponse.json(
        { ok: false, error: 'Valid job ID and score (1-5) are required' },
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

    // Validate job ownership and status
    if (jobData.customerId !== authResult.uid) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (jobData.status !== 'completed') {
      return NextResponse.json(
        { ok: false, error: 'Job must be completed to rate' },
        { status: 400 }
      );
    }

    if (jobData.rating) {
      return NextResponse.json(
        { ok: false, error: 'Job already rated' },
        { status: 400 }
      );
    }

    // Update job with rating
    await jobRef.update({
      rating: {
        score,
        comment: comment || '',
        byCustomerId: authResult.uid
      },
      updatedAt: new Date()
    });

    // Update provider rating aggregates if provider exists
    if (jobData.providerId) {
      const providerRef = db.collection('providers').doc(jobData.providerId);
      const providerDoc = await providerRef.get();

      if (providerDoc.exists) {
        const providerData = providerDoc.data() as ProviderDoc;
        const currentRatingCount = providerData.ratingCount || 0;
        const currentRatingAvg = providerData.ratingAvg || 0;
        
        // Calculate new average
        const newRatingCount = currentRatingCount + 1;
        const newRatingAvg = ((currentRatingAvg * currentRatingCount) + score) / newRatingCount;

        await providerRef.update({
          ratingAvg: newRatingAvg,
          ratingCount: newRatingCount,
          updatedAt: new Date()
        });
      }
    }

    return NextResponse.json({
      ok: true
    });

  } catch (error: any) {
    console.error('Error rating job:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
