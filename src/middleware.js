import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Exclude static files, public folder, and auth APIs
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get('farma_auth');
  let user = null;

  if (authCookie && authCookie.value) {
    try {
      const decoded = Buffer.from(authCookie.value, 'base64').toString('utf-8');
      user = JSON.parse(decoded);
    } catch (e) {
      console.error('Failed to parse auth cookie', e);
    }
  }

  // If not logged in and trying to access a protected page, redirect to /login
  if (!user && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If logged in and trying to access /login, redirect to /pos
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/pos', request.url));
  }

  // Authorization checks for cashier
  if (user && user.role === 'cashier') {
    const restrictedPaths = ['/', '/inventory', '/reports'];
    
    // Exact match for '/' since startsWith('/') matches everything
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/pos', request.url));
    }
    
    // Check other restricted paths
    const isRestricted = restrictedPaths.some(p => p !== '/' && pathname.startsWith(p));
    
    if (isRestricted) {
      return NextResponse.redirect(new URL('/pos', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
