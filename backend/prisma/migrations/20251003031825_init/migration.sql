/*
  Warnings:

  - You are about to drop the column `breaks` on the `SchoolSettings` table. All the data in the column will be lost.
  - You are about to drop the column `periodDuration` on the `SchoolSettings` table. All the data in the column will be lost.
  - You are about to drop the column `schoolEnd` on the `SchoolSettings` table. All the data in the column will be lost.
  - You are about to drop the column `schoolStart` on the `SchoolSettings` table. All the data in the column will be lost.
  - Added the required column `endTime` to the `SchoolSettings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `SchoolSettings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SchoolSettings" DROP COLUMN "breaks",
DROP COLUMN "periodDuration",
DROP COLUMN "schoolEnd",
DROP COLUMN "schoolStart",
ADD COLUMN     "endTime" TEXT NOT NULL,
ADD COLUMN     "startTime" TEXT NOT NULL;
