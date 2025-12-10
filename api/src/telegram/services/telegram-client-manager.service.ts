import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { PrismaService } from '../../prisma.service';
import type { ITelegramClient } from '../interfaces/telegram-client.interface';

@Injectable()
export class TelegramClientManagerService
  implements ITelegramClient, OnModuleDestroy
{
  private readonly logger = new Logger(TelegramClientManagerService.name);
  private client: TelegramClient | null = null;
  private initializing: Promise<void> | null = null;
  private currentSessionId: number | null = null;
  private unhandledRejectionHandler: ((reason: unknown) => void) | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.unhandledRejectionHandler = (reason: unknown) => {
      if (
        reason instanceof Error &&
        reason.message.includes('TIMEOUT') &&
        reason.stack?.includes('telegram/client/updates.js')
      ) {
        return;
      }
    };

    process.on('unhandledRejection', this.unhandledRejectionHandler);
  }

  onModuleDestroy(): void {
    if (this.unhandledRejectionHandler) {
      process.off('unhandledRejection', this.unhandledRejectionHandler);
    }
    if (this.client) {
      void this.client.disconnect();
    }
  }

  async getClient(): Promise<TelegramClient> {
    const sessionRecord = (await this.prisma.telegramSession.findFirst({
      orderBy: { updatedAt: 'desc' },
    })) as { id: number } | null;

    if (
      this.client &&
      this.currentSessionId ===
        ((sessionRecord as { id: number } | null)?.id ?? null)
    ) {
      return this.client;
    }

    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      this.currentSessionId = null;
    }

    if (!this.initializing) {
      this.initializing = this.initializeClient();
    }

    await this.initializing;
    if (!this.client) {
      throw new InternalServerErrorException(
        'Telegram client initialization failed',
      );
    }
    return this.client;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      this.currentSessionId = null;
    }
  }

  private async initializeClient(): Promise<void> {
    const settingsRecord = (await this.prisma.telegramSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    })) as { apiId: number | null; apiHash: string | null } | null;

    const apiIdRaw =
      (settingsRecord as { apiId: number | null } | null)?.apiId ??
      null ??
      this.configService.get<string | number>('TELEGRAM_API_ID');
    const apiHash =
      (settingsRecord as { apiHash: string | null } | null)?.apiHash ??
      null ??
      this.configService.get<string>('TELEGRAM_API_HASH');

    const apiId =
      typeof apiIdRaw === 'string' ? Number.parseInt(apiIdRaw, 10) : apiIdRaw;
    if (!apiId || Number.isNaN(apiId)) {
      throw new InternalServerErrorException(
        'TELEGRAM_API_ID is not configured. Please set it in Settings.',
      );
    }

    if (!apiHash) {
      throw new InternalServerErrorException(
        'TELEGRAM_API_HASH is not configured. Please set it in Settings.',
      );
    }

    const sessionRecord = (await this.prisma.telegramSession.findFirst({
      orderBy: { updatedAt: 'desc' },
    })) as { session: string; id: number } | null;

    const sessionString =
      (sessionRecord as { session: string } | null)?.session ??
      null ??
      this.configService.get<string>('TELEGRAM_SESSION');

    if (!sessionString) {
      throw new InternalServerErrorException(
        'TELEGRAM_SESSION is not configured. Please create a session first.',
      );
    }

    try {
      const session = new StringSession(sessionString);
      const client = new TelegramClient(session, apiId, apiHash, {
        connectionRetries: 5,
      });

      await client.connect();

      this.client = client;
      this.currentSessionId =
        (sessionRecord as { id: number } | null)?.id ?? null;
      this.logger.log('Telegram client initialized');
    } catch (error) {
      this.logger.error('Telegram client initialization error', error as Error);
      throw new InternalServerErrorException(
        'Failed to initialize Telegram client',
      );
    } finally {
      this.initializing = null;
    }
  }
}
