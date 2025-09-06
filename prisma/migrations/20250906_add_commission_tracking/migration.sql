-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "commissionAmount" REAL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN "merchantAmount" REAL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN "merchantPaid" BOOLEAN DEFAULT false;
ALTER TABLE "Payment" ADD COLUMN "merchantPayoutDate" TIMESTAMP;
