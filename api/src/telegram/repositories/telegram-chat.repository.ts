import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TelegramChatType } from '@prisma/client';

export interface TelegramChatCreateData {
  telegramId: bigint;
  type: TelegramChatType;
  title: string | null;
  username: string | null;
  description: string | null;
}

export interface TelegramChatUpdateData {
  type?: TelegramChatType;
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
