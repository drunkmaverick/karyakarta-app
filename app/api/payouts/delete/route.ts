import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { db } from '@/app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;
  try {
    const body = await req.json();
    const { id } = body || {};
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 });
    }
    const ref = db.collection('payouts').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
    }
    await ref.delete();
    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}















