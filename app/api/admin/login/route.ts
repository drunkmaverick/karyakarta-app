import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (password === adminPassword) {
      const response = NextResponse.json({ ok: true });
      response.cookies.set('admin', '1', {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 604800, // 7 days
      });
      return response;
    } else {
      return NextResponse.json(
        { ok: false, error: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message ?? String(e) },
      { status: 500 }
    );
  }
}
