-- CreateEnum
CREATE TYPE "MonitoringMessenger" AS ENUM ('whatsapp', 'max');

-- CreateTable
CREATE TABLE "MonitoringGroup" (
    "id" SERIAL NOT NULL,
    "messenger" "MonitoringMessenger" NOT NULL,
    "chatId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoringGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringGroup_messenger_chatId_key" ON "MonitoringGroup"("messenger", "chatId");

-- CreateIndex
CREATE INDEX "MonitoringGroup_messenger_idx" ON "MonitoringGroup"("messenger");

-- CreateIndex
CREATE INDEX "MonitoringGroup_category_idx" ON "MonitoringGroup"("category");
