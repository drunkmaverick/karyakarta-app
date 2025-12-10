import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { db } from '@/app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const guard = requireAdmin(request);
  if (guard) return guard;
  try {
    const body = await request.json().catch(() => ({}));
    const { id, status, notes } = body || {};
    if (!id || !status) {
      return NextResponse.json({ ok: false, error: 'id and status are required' }, { status: 400 });
    }

    const ref = db.collection('jobs').doc(String(id));
    const now = new Date();
    const update: Record<string, any> = { status: String(status), updatedAt: now };
    if (typeof notes === 'string') update.notes = notes;

    await ref.update(update);
    const snap = await ref.get();
    return NextResponse.json({ ok: true, job: { id: ref.id, ...snap.data() } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
