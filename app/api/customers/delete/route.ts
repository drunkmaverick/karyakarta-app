import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { dbAdmin } from '../../../lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  const guard = requireAdmin(request);
  if (guard) return guard;
  try {
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Customer ID is required' }, { status: 400 });
    }

    // Check if customer exists
    const docRef = dbAdmin.collection('customers').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return NextResponse.json({ ok: false, error: 'Customer not found' }, { status: 404 });
    }

    await docRef.delete();
    
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}