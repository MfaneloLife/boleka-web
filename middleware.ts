import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/landing',
  '/search',
  '/search(.*)',
  '/items/(.*)',
  '/auth/sign-in(.*)',
  '/auth/signup(.*)',
  '/auth/login(.*)',
  '/auth/error(.*)',
  '/api/payment/payfast-notify',
  '/api/webhooks(.*)',
  '/api/items(.*)',
  '/api/upload(.*)',
  '/api/reviews/stats(.*)',
  '/api/discounts/validate(.*)',
  '/_next(.*)',
  '/favicon.ico',
  '/manifest.json',
  '/icons(.*)',
  '/sw.js',
]);

export default clerkMiddleware(async (auth, req) => {
  // Only protect non-public routes if auth is configured
  if (!isPublicRoute(req) && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};