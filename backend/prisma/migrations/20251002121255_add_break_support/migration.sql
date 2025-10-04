/*
  Warnings:

  - You are about to drop the `SchoolSetting` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Timetable" ADD COLUMN     "breakType" TEXT,
ADD COLUMN     "isBreak" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "room" DROP NOT NULL,
ALTER COLUMN "teacherId" DROP NOT NULL;

-- DropTable
DROP TABLE "SchoolSetting";
