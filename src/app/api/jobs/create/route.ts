import { db as dbAdmin } from '../../../../app/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { customerId, areaId, service, scheduledAt } = body ?? {};
  if (!customerId || !areaId || !service) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const priceQuoted = await quote(service, areaId);
  const now = new Date();
  const batch = dbAdmin.batch();
  const jobRef = dbAdmin.collection('jobs').doc();
  batch.set(jobRef, {
    customerId, areaId, service,
    priceQuoted, status: 'created',
    ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
    createdAt: now, updatedAt: now,
  });
  const eventRef = dbAdmin.collection('job_events').doc();
  batch.set(eventRef, { jobId: jobRef.id, actorId: customerId, to: 'created', at: now });
  await batch.commit();
  return NextResponse.json({ id: jobRef.id, priceQuoted });
}

async function quote(service: string, _areaId: string) {
  const base: Record<string, number> = { deep_cleaning: 1499, ac_service: 699 };
  return Math.round(base[service] ?? 999);
}

export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response(JSON.stringify({ ok: true, route: "/api/jobs/create" }), { status: 200 });
}
