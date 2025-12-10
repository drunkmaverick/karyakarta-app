import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebaseAdmin';
import { requireCustomer } from '../../_lib/requireAuth';
import { JobsByCustomerResponse, JobDoc } from '../../../../src/types/app';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse<JobsByCustomerResponse>> {
  try {
    const authResult = await requireCustomer(request);
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<JobsByCustomerResponse>;
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor');

    const USE_MOCK = process.env.USE_MOCK === '1';
    
    if (USE_MOCK) {
      // Mock mode - return empty list
      return NextResponse.json({
        ok: true,
        items: [],
        nextCursor: undefined
      });
    }

    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    let query = db.collection('jobs')
      .where('customerId', '==', authResult.uid)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (cursor) {
      const cursorDoc = await db.collection('jobs').doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const items: JobDoc[] = [];
    let lastDoc: any = null;

    snapshot.forEach((doc) => {
      const data = doc.data();
      items.push({
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        scheduledFor: data.scheduledFor?.toDate?.() || data.scheduledFor
      } as JobDoc);
      lastDoc = doc;
    });

    return NextResponse.json({
      ok: true,
      items,
      nextCursor: lastDoc ? lastDoc.id : undefined
    });

  } catch (error: any) {
    console.error('Error fetching customer jobs:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
