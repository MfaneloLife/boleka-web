-- AlterTable: Add finalValue and paymentMethod to Request
ALTER TABLE "Request" ADD COLUMN "finalValue" DOUBLE PRECISION;
ALTER TABLE "Request" ADD COLUMN "paymentMethod" TEXT;

-- AlterEnum: Update RequestStatus to include NEGOTIATING and SUCCESSFUL
-- PostgreSQL allows adding new enum values at the end via ALTER TYPE
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'NEGOTIATING';
ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'SUCCESSFUL';

-- CreateEnum: PaymentMethod (only if not exists - this is a new enum type)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymentmethod') THEN
        CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'EFT', 'ONLINE');
    END IF;
END
$$;

-- Convert Request.paymentMethod from TEXT to PaymentMethod enum (if table has data)
-- For safety, we keep it as TEXT initially. The Prisma schema references the enum
-- but PostgreSQL will store it as TEXT unless we explicitly cast.
-- To convert (run manually after verifying data):
-- ALTER TABLE "Request" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod" USING "paymentMethod"::"PaymentMethod";