/*
  Warnings:

  - You are about to drop the column `timePeriodId` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the `TimePeriod` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `endTime` to the `Timetable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Timetable` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Timetable" DROP CONSTRAINT "Timetable_timePeriodId_fkey";

-- DropIndex
DROP INDEX "Timetable_sectionId_day_timePeriodId_key";

-- DropIndex
DROP INDEX "Timetable_teacherId_day_timePeriodId_idx";

-- AlterTable
ALTER TABLE "Timetable" DROP COLUMN "timePeriodId",
ADD COLUMN     "breakType" TEXT,
ADD COLUMN     "endTime" TEXT NOT NULL,
ADD COLUMN     "isBreak" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startTime" TEXT NOT NULL;

-- DropTable
DROP TABLE "TimePeriod";

-- CreateIndex
CREATE INDEX "Timetable_teacherId_day_startTime_endTime_idx" ON "Timetable"("teacherId", "day", "startTime", "endTime");
