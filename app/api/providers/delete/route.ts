import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { db } from '@/app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;
  try {
    const { id } = (await req.json()) as { id?: string };
    if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 });

    await db.collection('providers').doc(id).delete();
    return NextResponse.json({ ok: true, id });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}