# Yaga-Style Mobile UI Migration

## Overview
Replaced the existing Boleka landing page with a mobile-first Yaga-inspired design.

## New Components (`src/components/landing/`)
| Component | Description |
|-----------|-------------|
| `MobileHeader.tsx` | Sticky header with hamburger menu, logo, and Clerk auth buttons |
| `SearchBar.tsx` | Rounded search input with icon |
| `TabNav.tsx` | Discover / Shops / Favourites tabs with active indicator |
| `CategoryPills.tsx` | Horizontal scrollable category pills (Women, Men, Kids, etc.) |
| `CategoryGrid.tsx` | 2-column grid of category cards with overlay text |
| `HeroBanner.tsx` | Full-width hero with "ZERO selling fees" branding and stats |
| `BrandsSection.tsx` | Brand pills (Nike, ZARA, etc.) with "See more" link |
| `ShopsTab.tsx` | Favourite shops view with login gate for guests |
| `FavouritesTab.tsx` | Favourite items view with login gate for guests |
| `FloatingCTA.tsx` | Fixed "Start selling for free" pill button |
| `AppBanner.tsx` | Fixed bottom app download banner with dismiss |
| `ImageUploader.tsx` | R2 image upload component with previews |

## Auth (Clerk)
- Uses `@clerk/nextjs` v5 with `clerkMiddleware` in `middleware.ts`
- Public routes: `/`, `/search`, `/items/:id`, `/api/items`, `/api/categories`, `/auth/*`
- Guests can browse; protected routes redirect to `/auth/login`
- `SignInButton` / `SignUpButton` open modals from landing page

## Database (Neon + Prisma)
- Added `ItemImage` model to `schema.prisma` for R2 image URLs
- Removed single `image` field from `Item` in favor of `images[]` relation

## Image Uploads (Cloudflare R2)
- API route: `POST /api/upload/r2`
- Requires Clerk auth
- Uploads to R2 bucket and returns public URL
- Client hook: `useR2Upload()` in `src/hooks/useR2Upload.ts`
- UI component: `ImageUploader` with preview grid

## Environment Variables
```env
# Already present
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL=

# New (add to Vercel)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

## Next Steps
1. Run `npm install` to restore `node_modules` (currently missing @clerk types)
2. Add a real hero background image to `/public/hero-phone.jpg`
3. Replace placeholder avatar/item images in `ShopsTab.tsx`
4. Configure R2 credentials in `.env.local`
5. Run `npx prisma migrate dev` to apply the new `ItemImage` schema
