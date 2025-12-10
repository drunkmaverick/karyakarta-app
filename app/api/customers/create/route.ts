import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { dbAdmin } from '../../../lib/firebase-admin';
import { CreateCustomerRequest } from '../../../admin/customers/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const guard = requireAdmin(request);
  if (guard) return guard;
  try {
    const body: CreateCustomerRequest = await request.json();
    
    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json({ ok: false, error: 'Name is required' }, { status: 400 });
    }
    if (!body.phone?.trim()) {
      return NextResponse.json({ ok: false, error: 'Phone is required' }, { status: 400 });
    }
    if (!body.area?.trim()) {
      return NextResponse.json({ ok: false, error: 'Area is required' }, { status: 400 });
    }

    const now = new Date();
    const customerData = {
      name: body.name.trim(),
      phone: body.phone.trim(),
      email: body.email?.trim() || '',
      area: body.area.trim(),
      active: body.active !== undefined ? body.active : true,
      notes: body.notes?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await dbAdmin.collection('customers').add(customerData);
    
    return NextResponse.json({ 
      ok: true, 
      id: docRef.id,
      data: { id: docRef.id, ...customerData }
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}