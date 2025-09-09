import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/profile'];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // If accessing protected route without authentication, redirect to login
  if (isProtectedPath && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and trying to access dashboard, check profile completion
  if (token && request.nextUrl.pathname.startsWith('/dashboard')) {
    try {
      // Check if user has completed profile setup
      const response = await fetch(new URL('/api/profile/check', request.url), {
        headers: {
          'Cookie': request.headers.get('cookie') || '',
        },
      });

      if (response.ok) {
        const { needsProfileSetup } = await response.json();
        
        if (needsProfileSetup) {
          return NextResponse.redirect(new URL('/auth/profile-setup', request.url));
        }
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
      // If there's an error, redirect to profile setup to be safe
      return NextResponse.redirect(new URL('/auth/profile-setup', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
  ]
};
