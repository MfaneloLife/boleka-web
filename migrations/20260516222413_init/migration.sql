/*
  Warnings:

  - You are about to drop the column `deliveryMethod` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `itemType` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `rentalPrice` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the `ItemImage` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `endDate` on table `Booking` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ItemImage" DROP CONSTRAINT "ItemImage_itemId_fkey";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "deliveryMethod",
ALTER COLUMN "endDate" SET NOT NULL;

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "isActive",
DROP COLUMN "itemType",
DROP COLUMN "rentalPrice",
ADD COLUMN     "image" TEXT;

-- DropTable
DROP TABLE "ItemImage";

-- DropEnum
DROP TYPE "ItemType";
