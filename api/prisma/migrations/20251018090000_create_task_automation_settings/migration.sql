-- Create task automation settings table
CREATE TABLE IF NOT EXISTS "TaskAutomationSettings" (
    "id" SERIAL NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "runHour" INTEGER NOT NULL DEFAULT 3,
    "runMinute" INTEGER NOT NULL DEFAULT 0,
    "postLimit" INTEGER NOT NULL DEFAULT 10,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskAutomationSettings_pkey" PRIMARY KEY ("id")
);

