-- Add social marketing fields to Item (external Python marketing bot)
ALTER TABLE "Item" ADD COLUMN "is_posted_to_social" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Item" ADD COLUMN "social_post_url" TEXT;
