import { NextRequest, NextResponse } from 'next/server';
import { db as dbAdmin } from '../../../../app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ ok: true, route: '/api/payouts/create' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { spId, amount, jobId } = body ?? {};

    if (!spId || !amount || !jobId) {
      return NextResponse.json({ error: 'Missing fields: spId, amount, jobId' }, { status: 400 });
    }

    const now = new Date();
    const ref = dbAdmin.collection('payouts').doc();

    await ref.set({
      spId,
      amount,
      jobId,
      status: 'pending',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    return NextResponse.json({ ok: true, id: ref.id, spId, jobId, amount, ts: now.toISOString() });
  } catch (err: any) {
    console.error('[payouts/create]', err?.message || err);
    return NextResponse.json({ error: 'payout_create_failed', detail: err?.message || String(err) }, { status: 500 });
  }
}


