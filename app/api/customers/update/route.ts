import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { dbAdmin } from '../../../lib/firebase-admin';
import { UpdateCustomerRequest } from '../../../admin/customers/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const guard = requireAdmin(request);
  if (guard) return guard;
  try {
    const body: UpdateCustomerRequest = await request.json();
    
    if (!body.id) {
      return NextResponse.json({ ok: false, error: 'Customer ID is required' }, { status: 400 });
    }

    // Check if customer exists
    const docRef = dbAdmin.collection('customers').doc(body.id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return NextResponse.json({ ok: false, error: 'Customer not found' }, { status: 404 });
    }

    // Build update data (only include provided fields)
    const updateData: any = { updatedAt: new Date() };
    
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.phone !== undefined) updateData.phone = body.phone.trim();
    if (body.email !== undefined) updateData.email = body.email?.trim() || '';
    if (body.area !== undefined) updateData.area = body.area.trim();
    if (body.active !== undefined) updateData.active = body.active;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || '';

    await docRef.update(updateData);
    
    // Fetch updated document
    const updatedDoc = await docRef.get();
    
    return NextResponse.json({ 
      ok: true, 
      data: { id: updatedDoc.id, ...updatedDoc.data() }
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}



