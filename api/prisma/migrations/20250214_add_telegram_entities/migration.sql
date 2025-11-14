-- CreateEnum
CREATE TYPE "TelegramChatType" AS ENUM ('PRIVATE', 'GROUP', 'SUPERGROUP', 'CHANNEL');

-- CreateEnum
CREATE TYPE "TelegramMemberStatus" AS ENUM ('CREATOR', 'ADMINISTRATOR', 'MEMBER', 'RESTRICTED', 'LEFT', 'KICKED');

-- CreateTable
CREATE TABLE "TelegramChat" (
    "id" SERIAL NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "type" "TelegramChatType" NOT NULL,
    "title" TEXT,
    "username" TEXT,
    "photoUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramUser" (
    "id" SERIAL NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "username" TEXT,
    "phoneNumber" TEXT,
    "bio" TEXT,
    "languageCode" TEXT,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramChatMember" (
    "id" SERIAL NOT NULL,
    "chatId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" "TelegramMemberStatus" NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawPayload" JSONB,

    CONSTRAINT "TelegramChatMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramChat_telegramId_key" ON "TelegramChat"("telegramId");

-- CreateIndex
CREATE INDEX "TelegramChat_type_idx" ON "TelegramChat"("type");

-- CreateIndex
CREATE INDEX "TelegramChat_username_idx" ON "TelegramChat"("username");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramUser_telegramId_key" ON "TelegramUser"("telegramId");

-- CreateIndex
CREATE INDEX "TelegramUser_username_idx" ON "TelegramUser"("username");

-- CreateIndex
CREATE INDEX "TelegramUser_isBot_idx" ON "TelegramUser"("isBot");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramChatMember_chatId_userId_key" ON "TelegramChatMember"("chatId", "userId");

-- CreateIndex
CREATE INDEX "TelegramChatMember_userId_idx" ON "TelegramChatMember"("userId");

-- CreateIndex
CREATE INDEX "TelegramChatMember_status_idx" ON "TelegramChatMember"("status");

-- AddForeignKey
ALTER TABLE "TelegramChatMember" ADD CONSTRAINT "TelegramChatMember_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "TelegramChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramChatMember" ADD CONSTRAINT "TelegramChatMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TelegramUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

