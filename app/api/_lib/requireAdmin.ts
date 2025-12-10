// app/api/_lib/requireAdmin.ts
import { NextRequest, NextResponse } from 'next/server';

export function requireAdmin(req: NextRequest): NextResponse | null {
  const cookie = req.cookies.get('admin')?.value;
  if (cookie === '1') return null;
  return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
}