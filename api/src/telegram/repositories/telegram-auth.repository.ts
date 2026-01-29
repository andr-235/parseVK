import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import type {
  ITelegramAuthRepository,
  TelegramSessionCreate,
  TelegramSessionRecord,
  TelegramSettingsRecord,
  TelegramSettingsUpdate,
} from '../interfaces/telegram-auth-repository.interface.js';

@Injectable()
export class TelegramAuthRepository implements ITelegramAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLatestSettings(): Promise<TelegramSettingsRecord | null> {
    return this.prisma.telegramSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    }) as Promise<TelegramSettingsRecord | null>;
  }

  async upsertSettings(
    data: TelegramSettingsUpdate,
  ): Promise<TelegramSettingsRecord> {
    const existing = (await this.prisma.telegramSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    })) as { id: number } | null;

    if (existing) {
      return this.prisma.telegramSettings.update({
        where: { id: existing.id },
        data: {
          phoneNumber: data.phoneNumber ?? undefined,
          apiId: data.apiId ?? undefined,
          apiHash: data.apiHash ?? undefined,
        },
      }) as Promise<TelegramSettingsRecord>;
    }

    return this.prisma.telegramSettings.create({
      data: {
        phoneNumber: data.phoneNumber ?? null,
        apiId: data.apiId ?? null,
        apiHash: data.apiHash ?? null,
      },
    }) as Promise<TelegramSettingsRecord>;
  }

  findLatestSession(): Promise<TelegramSessionRecord | null> {
    return this.prisma.telegramSession.findFirst({
      orderBy: { updatedAt: 'desc' },
    }) as Promise<TelegramSessionRecord | null>;
  }

  async replaceSession(data: TelegramSessionCreate): Promise<void> {
    await this.prisma.telegramSession.deleteMany({});
    await this.prisma.telegramSession.create({
      data: {
        session: data.session,
        userId: data.userId,
        username: data.username,
        phoneNumber: data.phoneNumber,
      },
    });
  }

  async deleteAllSessions(): Promise<number> {
    const deleted = (await this.prisma.telegramSession.deleteMany({})) as {
      count: number;
    };
    return deleted.count ?? 0;
  }
}
