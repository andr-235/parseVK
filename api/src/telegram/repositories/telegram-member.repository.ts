import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import type { Prisma } from '@prisma/client';
import { TelegramMemberStatus } from '@prisma/client';

export interface TelegramUserCreateData {
  telegramId: bigint;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  phoneNumber: string | null;
  bio: string | null;
  languageCode: string | null;
  isBot: boolean;
  isPremium: boolean;
  deleted: boolean;
  restricted: boolean;
  verified: boolean;
  scam: boolean;
  fake: boolean;
  min: boolean;
  self: boolean;
  contact: boolean;
  mutualContact: boolean;
  accessHash: string | null;
  photoId: bigint | null;
  photoDcId: number | null;
  photoHasVideo: boolean;
  commonChatsCount: number | null;
  usernames: Prisma.InputJsonValue;
  personal: Prisma.InputJsonValue;
  botInfo: Prisma.InputJsonValue;
  blocked: boolean;
  contactRequirePremium: boolean;
  spam: boolean;
  closeFriend: boolean;
}

export interface TelegramChatMemberCreateData {
  chatId: number;
  userId: number;
  status: TelegramMemberStatus;
  isAdmin: boolean;
  isOwner: boolean;
  joinedAt: Date | null;
  leftAt: Date | null;
}

@Injectable()
export class TelegramMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsertUser(telegramId: bigint, data: TelegramUserCreateData) {
    return this.prisma.telegramUser.upsert({
      where: { telegramId },
      create: data,
      update: data,
    });
  }

  upsertChatMember(data: TelegramChatMemberCreateData) {
    return this.prisma.telegramChatMember.upsert({
      where: {
        chatId_userId: {
          chatId: data.chatId,
          userId: data.userId,
        },
      },
      create: data,
      update: {
        status: data.status,
        isAdmin: data.isAdmin,
        isOwner: data.isOwner,
        joinedAt: data.joinedAt,
        leftAt: data.leftAt,
      },
    });
  }
}
