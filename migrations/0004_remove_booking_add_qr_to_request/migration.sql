-- Drop the Booking table (deprecated — replaced by Request model)
DROP TABLE IF EXISTS "Booking" CASCADE;

-- Drop the BookingStatus enum
DROP TYPE IF EXISTS "BookingStatus";

-- Add QR Code and return tracking columns to Request
ALTER TABLE "Request" 
ADD COLUMN "qrCode" TEXT,
ADD COLUMN "qrCodeExpiresAt" TIMESTAMP(3),
ADD COLUMN "qrCodeScannedAt" TIMESTAMP(3),
ADD COLUMN "returnStatus" TEXT NOT NULL DEFAULT 'NOT_RETURNED',
ADD COLUMN "returnedAt" TIMESTAMP(3);