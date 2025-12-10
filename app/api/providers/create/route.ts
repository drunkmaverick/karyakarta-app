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
    const { name, phone, area, active } = body ?? {};
    if (!name || !phone) {
      return NextResponse.json({ ok: false, error: 'name and phone are required' }, { status: 400 });
    }
    const now = new Date();
    const payload = {
      name: String(name),
      phone: String(phone),
      area: area ? String(area) : '',
      active: typeof active === 'boolean' ? active : true,
      rating: 0,
      createdAt: now,
      updatedAt: now,
    };
    const ref = await db.collection('providers').add(payload);
    return NextResponse.json({ ok: true, id: ref.id, provider: { id: ref.id, ...payload } });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}
