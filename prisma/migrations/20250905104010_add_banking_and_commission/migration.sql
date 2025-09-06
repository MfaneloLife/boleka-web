-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "commissionAmount" REAL NOT NULL DEFAULT 0,
    "merchantAmount" REAL NOT NULL DEFAULT 0,
    "merchantPaid" BOOLEAN NOT NULL DEFAULT false,
    "merchantPayoutDate" DATETIME,
    "status" TEXT NOT NULL,
    "transactionId" TEXT,
    "paymentMethod" TEXT,
    "paymentDetails" TEXT,
    "payerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "commissionAmount", "createdAt", "id", "merchantAmount", "merchantPaid", "merchantPayoutDate", "payerId", "paymentDetails", "paymentMethod", "requestId", "status", "transactionId", "updatedAt") SELECT "amount", coalesce("commissionAmount", 0) AS "commissionAmount", "createdAt", "id", coalesce("merchantAmount", 0) AS "merchantAmount", coalesce("merchantPaid", false) AS "merchantPaid", "merchantPayoutDate", "payerId", "paymentDetails", "paymentMethod", "requestId", "status", "transactionId", "updatedAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
