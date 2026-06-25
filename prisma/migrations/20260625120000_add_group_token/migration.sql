-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "groupToken" TEXT;

-- CreateIndex
CREATE INDEX "bookings_groupToken_idx" ON "bookings"("groupToken");
