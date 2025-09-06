-- AlterTable
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Create a new User table with password nullable and copy data over
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "firebaseUid" TEXT,
    "image" TEXT,
    "hasBusinessProfile" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_User" ("id", "name", "email", "password", "firebaseUid", "image", "hasBusinessProfile", "createdAt", "updatedAt")
SELECT "id", "name", "email", "password", "firebaseUid", "image", "hasBusinessProfile", "createdAt", "updatedAt" FROM "User";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";

-- Recreate indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
