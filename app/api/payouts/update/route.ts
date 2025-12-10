import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { db } from '@/app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;
  try {
    const body = await req.json();
    const { id, status, notes } = body;

    if (!id || !status) {
      return NextResponse.json({ ok: false, error: 'id and status required' }, { status: 400 });
    }

    const ref = db.collection('payouts').doc(id);
    await ref.update({
      status,
      notes: notes ?? '',
      updatedAt: new Date(),
    });

    const updated = await ref.get();
    return NextResponse.json({ ok: true, payout: { id: updated.id, ...updated.data() } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}















