/*
  Warnings:

  - You are about to drop the `school_settings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "school_settings";

-- CreateTable
CREATE TABLE "SchoolSettings" (
    "id" TEXT NOT NULL,
    "schoolStart" TEXT NOT NULL,
    "schoolEnd" TEXT NOT NULL,
    "breaks" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolSettings_pkey" PRIMARY KEY ("id")
);
