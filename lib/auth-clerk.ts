// lib/auth-clerk.ts
// Clerk server-side auth utilities for API route migration
// Replaces getServerSession(authOptions) from NextAuth

import { auth } from '@clerk/nextjs/server';
import { prisma } from './prisma';

/**
 * Gets the authenticated user's ID from Clerk session.
 * Returns null if not authenticated.
 */
export async function getAuthUserId(): Promise<string | null> {
  try {
    const session = await auth();
    return session?.userId || null;
  } catch {
    return null;
  }
}

/**
 * Gets the authenticated user from Clerk + Prisma.
 * Returns null if not authenticated or user not found.
 */
export async function getAuthUser() {
  const userId = await getAuthUserId();
  if (!userId) return null;
  
  try {
    return await prisma.user.findUnique({ where: { id: userId } });
  } catch {
    return null;
  }
}

/**
 * Combines auth check + throws error if not authenticated.
 * Returns the user ID.
 */
export async function requireAuth(): Promise<string> {
  const userId = await getAuthUserId();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

/**
 * Gets the authenticated user's email from Clerk.
 * Used by API routes that need to look up user by email.
 */
export async function getAuthUserEmail(): Promise<string | null> {
  try {
    const session = await auth();
    return session?.sessionClaims?.email as string || null;
  } catch {
    return null;
  }
}
