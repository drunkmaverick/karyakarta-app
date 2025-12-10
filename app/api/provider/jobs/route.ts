import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebaseAdmin';
import { requireProvider } from '../../_lib/requireAuth';
import { ProviderJobsResponse, JobDoc } from '../../../../src/types/app';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse<ProviderJobsResponse>> {
  try {
    const authResult = await requireProvider(request);
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<ProviderJobsResponse>;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const USE_MOCK = process.env.USE_MOCK === '1';
    
    if (USE_MOCK) {
      // Mock mode - return empty list
      return NextResponse.json({
        ok: true,
        items: []
      });
    }

    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    let query = db.collection('jobs')
      .where('providerId', '==', authResult.uid)
      .orderBy('createdAt', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const items: JobDoc[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      items.push({
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        scheduledFor: data.scheduledFor?.toDate?.() || data.scheduledFor
      } as JobDoc);
    });

    return NextResponse.json({
      ok: true,
      items
    });

  } catch (error: any) {
    console.error('Error fetching provider jobs:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
