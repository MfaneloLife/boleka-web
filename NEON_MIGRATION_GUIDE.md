# Firebase → Neon PostgreSQL Migration Guide

## Quick Start

This guide walks you through migrating Boleka from Firebase to Neon PostgreSQL with NextAuth.

---

## Step 1: Create Neon Account & Database

### 1.1 Sign up at Neon
1. Go to https://console.neon.tech/
2. Create a free account
3. Create a new project named "boleka"

### 1.2 Create Database
1. In the Neon console, create a new database named `boleka_db`
2. Copy the connection string (should look like):
   ```
   postgresql://user:password@host.neon.tech/boleka_db?sslmode=require
   ```

### 1.3 Set Environment Variable
```bash
# Add to .env.local
DATABASE_URL="postgresql://user:password@host.neon.tech/boleka_db?sslmode=require"
```

---

## Step 2: Install Dependencies

```bash
# Install Prisma
npm install -D prisma

# Install Prisma Client (already included in @prisma/client)
npm install @prisma/client

# Install NextAuth Adapter for Prisma
npm install @next-auth/prisma-adapter

# Install database driver (pg)
npm install pg
```

---

## Step 3: Update Prisma Schema

The schema has already been updated to include:
- ✅ NextAuth tables (Account, Session, VerificationToken)
- ✅ Extended User model
- ✅ Booking with status enum (PENDING, PAID, FROZEN, COMPLETED, CANCELLED)
- ✅ Item with delivery logic (allowCollection, allowDelivery, deliveryFee)
- ✅ Location fields (lat, lng, address, quantity)

**File:** `schema.prisma` (in root, will move to `prisma/schema.prisma`)

---

## Step 4: Set Up Prisma Locally

### 4.1 Initialize Prisma Project
```bash
# Creates prisma folder and sets up Prisma CLI
npx prisma init --datasource-provider postgresql
```

### 4.2 Generate Prisma Client
```bash
npx prisma generate
```

### 4.3 Create Initial Migration
```bash
# Creates migration files and applies to Neon
npx prisma migrate dev --name init
```

### 4.4 Verify in Prisma Studio
```bash
# Opens GUI to view your database
npx prisma studio
```

---

## Step 5: Update NextAuth Configuration

### 5.1 Use New Auth Configuration
We've created `lib/auth-neon.ts` with Neon adapter.

Update the NextAuth route:
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-neon';  // Use Neon version

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### 5.2 Required Environment Variables
```env
# .env.local
NEXTAUTH_SECRET=your_secret_here
DATABASE_URL=your_neon_connection_string

# Email (optional)
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email
EMAIL_SERVER_PASSWORD=your_password
EMAIL_FROM=noreply@boleka.com

# OAuth (optional)
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
FACEBOOK_CLIENT_ID=your_facebook_id
FACEBOOK_CLIENT_SECRET=your_facebook_secret
```

---

## Step 6: Update Frontend for Public Routes

The middleware has been updated to support:
- ✅ Public routes: `/`, `/search`, `/items/[id]` (guests can view)
- ✅ Auth wall: Redirect to signin when guests click "Rent Now", "Chat", or "Add to Cart"

### 6.1 Use Protected Action Hook
```typescript
// Use the useAuthWall hook
import { useAuthWall } from '@/lib/useAuthWall';

export function RentButton() {
  const { isAuthenticated, requireAuth } = useAuthWall();

  return (
    <button onClick={requireAuth(handleRent)}>
      {isAuthenticated ? 'Rent Now' : 'Sign in to Rent'}
    </button>
  );
}
```

### 6.2 Use Protected Action Component
```typescript
// Or use the component wrapper
import { useProtectedAction } from '@/lib/protected-action-wrapper';

export function RentButton() {
  const { handleProtectedAction } = useProtectedAction();

  return (
    <button onClick={() => handleProtectedAction(handleRent)}>
      Rent Now
    </button>
  );
}
```

---

## Step 7: Update API Routes

Replace Firebase calls with Prisma:

### Example: Get Items
```typescript
// Before (Firebase)
const itemsRef = collection(db, 'items');
const querySnapshot = await getDocs(itemsRef);

// After (Prisma)
import { prisma } from '@/lib/prisma';
const items = await prisma.item.findMany();
```

### Example: Create Booking
```typescript
// Before (Firebase)
await addDoc(collection(db, 'bookings'), bookingData);

// After (Prisma)
const booking = await prisma.booking.create({
  data: bookingData,
});
```

---

## Step 8: Migrate Data from Firebase (Optional)

If you need to migrate existing Firebase data:

### 8.1 Export Firebase Data
```bash
# Use Firebase CLI to export data
firebase firestore:export ./firestore-export
```

### 8.2 Transform and Import to Neon
Create a migration script (`scripts/migrate-firebase-to-neon.ts`) to:
1. Read exported Firebase data
2. Map fields to Prisma schema
3. Batch insert into Neon

---

## Step 9: Testing

### Test Public Routes
- [ ] Visit `/` - should load without auth
- [ ] Visit `/search` - should load without auth
- [ ] Visit `/items/123` - should load without auth

### Test Auth Wall
- [ ] Click "Rent Now" as guest - should redirect to `/auth/signin`
- [ ] Click "Chat" as guest - should redirect to `/auth/signin`
- [ ] Click "Add to Cart" as guest - should redirect to `/auth/signin`

### Test Authentication
- [ ] Sign up with email - should create account in Neon
- [ ] Sign in with Google - should work
- [ ] Sign out - session should be cleared
- [ ] Session persistence - reload page, should stay logged in

---

## Step 10: Deploy to Vercel

### 10.1 Update Vercel Environment
1. Go to Vercel project settings
2. Add environment variables:
   - `DATABASE_URL` → Your Neon connection string
   - `NEXTAUTH_SECRET` → Your secret
   - Other OAuth/Email variables if used

### 10.2 Deploy
```bash
git push  # Vercel auto-deploys
```

---

## Troubleshooting

### Connection Issues
```
Error: connect ECONNREFUSED
```
**Solution:** Check DATABASE_URL is correct and Neon IP allowlist includes your IP.

### Migration Errors
```
Error: P1000 Authentication failed
```
**Solution:** Verify DATABASE_URL credentials in Neon console.

### Schema Conflicts
```
Error: Unique constraint failed
```
**Solution:** Run `npx prisma migrate reset` to clear and recreate (dev only).

---

## Next Steps

1. [ ] Complete Steps 1-5 (Setup & Auth)
2. [ ] Update API routes to use Prisma
3. [ ] Test public/auth routes
4. [ ] Migrate Firebase data
5. [ ] Deploy to production
6. [ ] Remove Firebase dependencies

---

## File Changes Summary

### Created Files
- ✅ `lib/prisma.ts` - Prisma client singleton
- ✅ `lib/auth-neon.ts` - NextAuth with Neon adapter
- ✅ `lib/useAuthWall.ts` - Auth wall hook
- ✅ `lib/protected-action-wrapper.tsx` - Protected action wrapper

### Updated Files
- ✅ `middleware.ts` - Public routes configuration
- ✅ `schema.prisma` - NextAuth tables + Neon schema
- ✅ `.env.example` - Neon configuration

### To Remove (After Migration)
- `lib/firebase.ts`
- `lib/firebase-admin.ts`
- `src/lib/firebase*.ts`
- Firebase dependencies from `package.json`

---

## References

- **Neon Docs**: https://neon.tech/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **NextAuth Docs**: https://next-auth.js.org
- **NextAuth Prisma Adapter**: https://next-auth.js.org/adapters/prisma

---

## Support

For questions during migration:
1. Check Neon console for connection issues
2. Review Prisma logs: `npx prisma debug`
3. Check NextAuth debug mode in dev env
4. Review middleware logs for route issues

