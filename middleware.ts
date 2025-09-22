import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isPublicPage = ['/', '/about', '/terms', '/privacy'].includes(request.nextUrl.pathname);

  // Protected routes that require authentication
  // NOTE: Do NOT include '/dashboard' here because we use Firebase auth client-side
  // via FirebaseProtectedRoute. NextAuth token isn't present for Firebase-only users.
  const protectedPaths = ['/profile', '/api/reviews', '/api/rental-agreements', '/api/reminders', '/api/rewards'];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard/client', request.url));
  }

  // If accessing protected route without authentication, redirect to sign-in
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // If user is authenticated and trying to access dashboard, allow access
  // Profile setup is now optional and can be completed later from the dashboard
  if (token && request.nextUrl.pathname.startsWith('/dashboard')) {
    // Allow all authenticated users to access dashboard
    // They can complete their profile later from the profile page
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ]
};
