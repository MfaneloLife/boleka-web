-- ============================================================================
-- Migration: Unify Categories across the Boleka platform
-- ============================================================================
-- Maps old/inconsistent category strings to the new unified category keys.
--
-- IMPORTANT: Run this AFTER deploying the updated API and frontend code.
--            The new code handles both old and new category values via
--            the `categoryDisplayName()` fallback, so backwards-compatibility
--            is maintained during rollout.
-- ============================================================================

-- 1. ELECTRONICS_TECH: absorbs 'electronics', 'technology', 'photography'
UPDATE "Item" SET "category" = 'ELECTRONICS_TECH'
WHERE "category" IN ('electronics', 'Electronics', 'Technology', 'technology', 'photography', 'Photography & Video');

-- 2. HOME_GARDEN: absorbs 'home', 'Home & Garden', 'Home & Garden Tools', 'tools', 'tools-equipment'
UPDATE "Item" SET "category" = 'HOME_GARDEN'
WHERE "category" IN ('home', 'Home', 'Home & Garden', 'Home & Garden Tools', 'tools', 'Tools & Equipment', 'tools-equipment');

-- 3. EVENTS_CATERING: absorbs 'events', 'event-catering', 'Events & Catering'
UPDATE "Item" SET "category" = 'EVENTS_CATERING'
WHERE "category" IN ('events', 'Events & Catering', 'event-catering', 'Event & Catering');

-- 4. SPORTS_LEISURE: absorbs 'sports', 'sport-kit', 'Sports & Leisure', 'Sport Kit'
UPDATE "Item" SET "category" = 'SPORTS_LEISURE'
WHERE "category" IN ('sports', 'Sports & Leisure', 'sport-kit', 'Sport Kit', 'music', 'Music & Instruments');

-- 5. CAMPING_OUTDOOR: absorbs 'camping'
UPDATE "Item" SET "category" = 'CAMPING_OUTDOOR'
WHERE "category" IN ('camping', 'Camping & Outdoor');

-- 6. BOOKS_MEDIA: absorbs 'books'
UPDATE "Item" SET "category" = 'BOOKS_MEDIA'
WHERE "category" IN ('books', 'Books & Magazine', 'Books & Media');

-- 7. CLOTHING_FASHION: absorbs 'fashion', 'beauty', 'Beauty'
UPDATE "Item" SET "category" = 'CLOTHING_FASHION'
WHERE "category" IN ('fashion', 'Fashion', 'beauty', 'Beauty');

-- 8. VEHICLES_TRANSPORT: absorbs 'vehicles'
UPDATE "Item" SET "category" = 'VEHICLES_TRANSPORT'
WHERE "category" IN ('vehicles', 'Vehicles');

-- 9. TOYS_GAMES: absorbs 'toys-games'
UPDATE "Item" SET "category" = 'TOYS_GAMES'
WHERE "category" IN ('toys-games', 'Toys & Games');

-- 10. LOCAL_DESIGN_CRAFTS: absorbs 'design'
UPDATE "Item" SET "category" = 'LOCAL_DESIGN_CRAFTS'
WHERE "category" IN ('design', 'Local Design');

-- 11. OTHER: absorbs anything that didn't match above (safe catch-all for existing records)
--    Only update categories that don't already match the new format (no prefix 'ELECTRONICS_TECH' etc)
UPDATE "Item" SET "category" = 'OTHER'
WHERE "category" NOT IN (
  'ELECTRONICS_TECH', 'HOME_GARDEN', 'EVENTS_CATERING', 'SPORTS_LEISURE',
  'CAMPING_OUTDOOR', 'BOOKS_MEDIA', 'CLOTHING_FASHION', 'VEHICLES_TRANSPORT',
  'TOYS_GAMES', 'LOCAL_DESIGN_CRAFTS', 'OTHER'
);