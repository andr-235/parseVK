-- CreateTable
CREATE TABLE "TelegramSession" (
    "id" SERIAL PRIMARY KEY,
    "session" TEXT NOT NULL,
    "userId" INTEGER,
    "username" TEXT,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "TelegramSession_userId_idx" ON "TelegramSession"("userId");

