import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { db } from '@/app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

type UpdateBody = {
  id: string;
  name?: string;
  phone?: string;
  city?: string;
  skills?: string[];
  rating?: number;
  status?: 'active' | 'inactive' | 'blocked';
  notes?: string;
};

export async function POST(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;
  try {
    const body = (await req.json()) as Partial<UpdateBody> | null;
    const id = body?.id;
    if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 });

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (typeof body.name === 'string') updates.name = body.name.trim();
    if (typeof body.phone === 'string') updates.phone = body.phone.trim();
    if (typeof body.city === 'string') updates.city = body.city;
    if (Array.isArray(body.skills)) updates.skills = body.skills.slice(0, 20);
    if (typeof body.rating === 'number') updates.rating = Math.max(0, Math.min(5, body.rating));
    if (body.status) updates.status = body.status;
    if (typeof body.notes === 'string') updates.notes = body.notes;

    await db.collection('providers').doc(id).update(updates);
    const fresh = await db.collection('providers').doc(id).get();
    return NextResponse.json({ ok: true, provider: { id, ...fresh.data() } });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}