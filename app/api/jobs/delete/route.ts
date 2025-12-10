import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { db } from '@/app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  const guard = requireAdmin(request);
  if (guard) return guard;
  try {
    const body = await request.json().catch(() => ({}));
    const { id } = body || {};
    if (!id) {
      return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 });
    }
    const ref = db.collection('jobs').doc(String(id));
    await ref.delete();
    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
