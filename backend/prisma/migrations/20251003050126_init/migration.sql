/*
  Warnings:

  - You are about to drop the column `breakType` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the column `isBreak` on the `Timetable` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Timetable` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sectionId,day,timePeriodId]` on the table `Timetable` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `timePeriodId` to the `Timetable` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Timetable_teacherId_day_startTime_endTime_idx";

-- AlterTable
ALTER TABLE "Timetable" DROP COLUMN "breakType",
DROP COLUMN "endTime",
DROP COLUMN "isBreak",
DROP COLUMN "startTime",
ADD COLUMN     "timePeriodId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "TimePeriod" (
    "id" TEXT NOT NULL,
    "periodName" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isBreak" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TimePeriod_orderIndex_key" ON "TimePeriod"("orderIndex");

-- CreateIndex
CREATE INDEX "Timetable_teacherId_day_timePeriodId_idx" ON "Timetable"("teacherId", "day", "timePeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "Timetable_sectionId_day_timePeriodId_key" ON "Timetable"("sectionId", "day", "timePeriodId");

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_timePeriodId_fkey" FOREIGN KEY ("timePeriodId") REFERENCES "TimePeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
