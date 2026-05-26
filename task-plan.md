# Migration Task Plan

## Status
- Clerk is already installed & partially configured (middleware, login/signup pages, items API)
- NextAuth still used in ~38 API routes, ~15 client components, AuthContext
- Need to fully migrate to Clerk + Neon/Prisma

## Steps
1. Create Clerk server-side auth helper (`lib/auth-clerk.ts`)
2. Update `Providers.tsx` to use only Clerk (remove SessionProvider)
3. Update `AuthContext.tsx` to use Clerk hooks
4. Update `AuthButton.tsx` to use Clerk hooks
5. Update all API route files to use Clerk `auth()` instead of `getServerSession(authOptions)`
6. Update client components using `useSession` from NextAuth
7. Clean up: Remove NextAuth config, Firebase files, unused files
8. Update Prisma schema (remove NextAuth tables)
9. Run Prisma migrations
10. Update env files for production
11. Commit and push to GitHub
