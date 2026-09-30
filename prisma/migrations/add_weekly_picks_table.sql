-- Create WeeklyPick model to store curated weekly items
CREATE TABLE "WeeklyPick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WeeklyPick_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE,
    CONSTRAINT "WeeklyPick_weekStart_position_key" UNIQUE("weekStart", "position")
);

CREATE INDEX "WeeklyPick_weekStart_idx" ON "WeeklyPick"("weekStart");
CREATE INDEX "WeeklyPick_itemId_idx" ON "WeeklyPick"("itemId");