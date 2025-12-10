import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { db } from '@/app/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  const guard = requireAdmin(request);
  if (guard) return guard;
  try {
    const body = await request.json().catch(() => ({}));
    const { providerId, amount, currency = 'INR', notes = '' } = body;

    if (!providerId || typeof providerId !== 'string') {
      return NextResponse.json({ ok: false, error: 'providerId (string) required' }, { status: 400 });
    }
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ ok: false, error: 'amount (number > 0) required' }, { status: 400 });
    }

    const doc = {
      providerId,
      amount: parsedAmount,
      currency,
      status: 'pending' as const,
      notes,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'api',
    };

    const ref = await db.collection('payouts').add(doc);
    const saved = await ref.get();
    return NextResponse.json({ ok: true, id: ref.id, payout: { id: ref.id, ...saved.data() } }, { status: 201 });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}
