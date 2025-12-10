import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  console.log('🚀 MIDDLEWARE CALLED:', request.nextUrl.pathname);
  
  const { pathname } = request.nextUrl;
  
  // Allow /admin/login without authentication
  if (pathname === '/admin/login') {
    console.log('✅ Allowing /admin/login');
    return NextResponse.next();
  }
  
  // Protect all other admin routes
  if (pathname.startsWith('/admin')) {
    const adminCookie = request.cookies.get('admin');
    console.log('🍪 Admin cookie:', adminCookie?.value);
    
    if (adminCookie?.value === '1') {
      console.log('✅ Admin authenticated, allowing access');
      return NextResponse.next();
    } else {
      console.log('❌ Admin not authenticated, redirecting to login');
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  console.log('➡️ Not an admin route, continuing');
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*'
  ],
};