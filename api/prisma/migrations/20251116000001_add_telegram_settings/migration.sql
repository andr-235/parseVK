-- CreateTable
CREATE TABLE "TelegramSettings" (
    "id" SERIAL PRIMARY KEY,
    "phoneNumber" TEXT,
    "apiId" INTEGER,
    "apiHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

