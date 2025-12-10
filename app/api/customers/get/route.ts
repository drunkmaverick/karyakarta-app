import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { dbAdmin } from '../../../lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = requireAdmin(request);
  if (guard) return guard;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Customer ID is required' }, { status: 400 });
    }

    const doc = await dbAdmin.collection('customers').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json({ ok: false, error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      ok: true, 
      data: { id: doc.id, ...doc.data() }
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}