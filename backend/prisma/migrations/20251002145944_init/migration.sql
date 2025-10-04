-- CreateTable
CREATE TABLE "PeriodConfig" (
    "id" TEXT NOT NULL,
    "schoolDay" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "periodNumber" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PeriodConfig_schoolDay_isActive_idx" ON "PeriodConfig"("schoolDay", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodConfig_schoolDay_periodNumber_key" ON "PeriodConfig"("schoolDay", "periodNumber");
