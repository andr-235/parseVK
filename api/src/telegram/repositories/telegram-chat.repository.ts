import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import type { Prisma } from '@prisma/client';

export interface TelegramChatCreateData {
  telegramId: bigint;
  type: string;
  title: string | null;
  username: string | null;
  description: string | null;
}

export interface TelegramChatUpdateData {
  type?: string;
  title?: string | null;
  username?: string | null;
  description?: string | null;
}

@Injectable()
export class TelegramChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number) {
    return this.prisma.telegramChat.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findByTelegramId(telegramId: bigint) {
    return this.prisma.telegramChat.findUnique({
      where: { telegramId },
    });
  }

  async upsert(
    telegramId: bigint,
    create: TelegramChatCreateData,
    update: TelegramChatUpdateData,
  ) {
    return this.prisma.telegramChat.upsert({
      where: { telegramId },
      create,
      update,
    });
  }
}

