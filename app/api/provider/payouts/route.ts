import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebaseAdmin';
import { requireProvider } from '../../_lib/requireAuth';
import { ProviderPayoutsResponse, PayoutDoc } from '../../../../src/types/app';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse<ProviderPayoutsResponse>> {
  try {
    const authResult = await requireProvider(request);
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<ProviderPayoutsResponse>;
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

    let query = db.collection('payouts')
      .where('providerId', '==', authResult.uid)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (cursor) {
      const cursorDoc = await db.collection('payouts').doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const items: PayoutDoc[] = [];
    let lastDoc: any = null;

    snapshot.forEach((doc) => {
      const data = doc.data();
      items.push({
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      } as PayoutDoc);
      lastDoc = doc;
    });

    return NextResponse.json({
      ok: true,
      items,
      nextCursor: lastDoc ? lastDoc.id : undefined
    });

  } catch (error: any) {
    console.error('Error fetching provider payouts:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
