import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const response = NextResponse.json({ ok: true });
    response.cookies.set('admin', '', {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 0,
    });
    return response;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message ?? String(e) },
      { status: 500 }
    );
  }
}
