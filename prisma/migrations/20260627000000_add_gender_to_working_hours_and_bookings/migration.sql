-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE');

-- AlterTable
ALTER TABLE "working_hours" ADD COLUMN "gender" "Gender" NOT NULL DEFAULT 'MALE';

-- DropIndex
DROP INDEX "working_hours_dayOfWeek_key";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "gender" "Gender" NOT NULL DEFAULT 'MALE';

-- CreateIndex
CREATE UNIQUE INDEX "working_hours_dayOfWeek_gender_key" ON "working_hours"("dayOfWeek", "gender");

-- AlterTable
ALTER TABLE "working_hours" ALTER COLUMN "gender" DROP DEFAULT;

-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "gender" DROP DEFAULT;
