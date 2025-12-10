import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { PrismaService } from '../prisma.service';
import type {
  ConfirmTelegramSessionDto,
  ConfirmTelegramSessionResponseDto,
} from './dto/confirm-session.dto';
import type {
  StartTelegramSessionDto,
  StartTelegramSessionResponseDto,
} from './dto/start-session.dto';
import type {
  TelegramSettingsDto,
  TelegramSettingsResponseDto,
} from './dto/telegram-settings.dto';

interface AuthTransactionState {
  phoneNumber: string;
  phoneCodeHash: string;
  session: string;
  apiId: number;
  apiHash: string;
  createdAt: string;
}

const CACHE_PREFIX = 'telegram:auth:tx:';
const DEFAULT_CODE_LENGTH = 5;
const TRANSACTION_TTL_SEC = 5 * 60;

@Injectable()
export class TelegramAuthService {
  private readonly logger = new Logger(TelegramAuthService.name);
  private readonly defaultApiId: number | null;
  private readonly defaultApiHash: string | null;

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly prisma: PrismaService,
  ) {
    const apiIdRaw = this.configService.get<string | number>('TELEGRAM_API_ID');
    const apiHash = this.configService.get<string>('TELEGRAM_API_HASH');

    const parsedApiId =
      typeof apiIdRaw === 'string' ? Number.parseInt(apiIdRaw, 10) : apiIdRaw;

    this.defaultApiId =
      parsedApiId && !Number.isNaN(parsedApiId) ? parsedApiId : null;
    this.defaultApiHash = apiHash || null;
  }

  async getSettings(): Promise<TelegramSettingsResponseDto | null> {
    const settings = (await this.prisma.telegramSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    })) as {
      phoneNumber: string | null;
      apiId: number | null;
      apiHash: string | null;
      createdAt: Date;
      updatedAt: Date;
    } | null;

    if (!settings) {
      return null;
    }

    return {
      phoneNumber: (settings as { phoneNumber: string | null }).phoneNumber,
      apiId: (settings as { apiId: number | null }).apiId,
      apiHash: (settings as { apiHash: string | null }).apiHash,
      createdAt: (settings as { createdAt: Date }).createdAt.toISOString(),
      updatedAt: (settings as { updatedAt: Date }).updatedAt.toISOString(),
    };
  }

  async updateSettings(
    payload: TelegramSettingsDto,
  ): Promise<TelegramSettingsResponseDto> {
    const existing = (await this.prisma.telegramSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    })) as { id: number } | null;

    const settings = existing
      ? ((await this.prisma.telegramSettings.update({
          where: { id: (existing as { id: number }).id },
          data: {
            phoneNumber: payload.phoneNumber ?? undefined,
            apiId: payload.apiId ?? undefined,
            apiHash: payload.apiHash ?? undefined,
          },
        })) as {
          phoneNumber: string | null;
          apiId: number | null;
          apiHash: string | null;
          createdAt: Date;
          updatedAt: Date;
        })
      : ((await this.prisma.telegramSettings.create({
          data: {
            phoneNumber: payload.phoneNumber ?? null,
            apiId: payload.apiId ?? null,
            apiHash: payload.apiHash ?? null,
          },
        })) as {
          phoneNumber: string | null;
          apiId: number | null;
          apiHash: string | null;
          createdAt: Date;
          updatedAt: Date;
        });

    return {
      phoneNumber: (settings as { phoneNumber: string | null }).phoneNumber,
      apiId: (settings as { apiId: number | null }).apiId,
      apiHash: (settings as { apiHash: string | null }).apiHash,
      createdAt: (settings as { createdAt: Date }).createdAt.toISOString(),
      updatedAt: (settings as { updatedAt: Date }).updatedAt.toISOString(),
    };
  }

  async startSession(
    payload: StartTelegramSessionDto,
  ): Promise<StartTelegramSessionResponseDto> {
    const savedSettings = (await this.prisma.telegramSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    })) as {
      phoneNumber: string | null;
      apiId: number | null;
      apiHash: string | null;
    } | null;

    const phoneNumber =
      payload.phoneNumber?.trim() ??
      (
        savedSettings as { phoneNumber: string | null } | null
      )?.phoneNumber?.trim() ??
      null;
    if (!phoneNumber) {
      throw new BadRequestException('PHONE_NUMBER_REQUIRED');
    }

    const apiId =
      payload.apiId ??
      (savedSettings as { apiId: number | null } | null)?.apiId ??
      null ??
      this.defaultApiId;
    const apiHash =
      payload.apiHash ??
      (savedSettings as { apiHash: string | null } | null)?.apiHash ??
      null ??
      this.defaultApiHash;

    if (!apiId || !apiHash) {
      throw new BadRequestException('API_ID_AND_HASH_REQUIRED');
    }

    await this.deleteExistingSession();

    const client = await this.createClient('', apiId, apiHash);

    try {
      const response = await client.sendCode(
        {
          apiId,
          apiHash,
        },
        phoneNumber,
        false,
      );

      const transactionId = randomUUID();
      const sessionString = client.session.save() as unknown as string;

      const state: AuthTransactionState = {
        phoneNumber,
        phoneCodeHash: response.phoneCodeHash,
        session: sessionString,
        apiId,
        apiHash,
        createdAt: new Date().toISOString(),
      };

      await this.cache.set(
        this.buildCacheKey(transactionId),
        state,
        TRANSACTION_TTL_SEC * 1000,
      );

      return {
        transactionId,
        codeLength: DEFAULT_CODE_LENGTH,
        nextType: response.isCodeViaApp ? 'app' : 'sms',
        timeoutSec: null,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send Telegram code for ${phoneNumber}: ${this.stringifyError(error)}`,
      );
      if (error instanceof Error && 'errorMessage' in error) {
        throw new BadRequestException(
          (error as { errorMessage?: string }).errorMessage ?? 'TELEGRAM_ERROR',
        );
      }
      throw new InternalServerErrorException('TELEGRAM_SEND_CODE_FAILED');
    } finally {
      await client.disconnect();
    }
  }

  async getCurrentSession(): Promise<ConfirmTelegramSessionResponseDto | null> {
    const sessionRecord = (await this.prisma.telegramSession.findFirst({
      orderBy: { updatedAt: 'desc' },
    })) as {
      session: string;
      userId: number | null;
      username: string | null;
      phoneNumber: string | null;
    } | null;

    if (!sessionRecord) {
      return null;
    }

    return {
      session: (sessionRecord as { session: string }).session,
      expiresAt: null,
      userId: (sessionRecord as { userId: number | null }).userId ?? 0,
      username: (sessionRecord as { username: string | null }).username,
      phoneNumber: (sessionRecord as { phoneNumber: string | null })
        .phoneNumber,
    };
  }

  async confirmSession(
    payload: ConfirmTelegramSessionDto,
  ): Promise<ConfirmTelegramSessionResponseDto> {
    const transaction = await this.cache.get<AuthTransactionState>(
      this.buildCacheKey(payload.transactionId),
    );

    if (!transaction) {
      throw new BadRequestException('TRANSACTION_NOT_FOUND_OR_EXPIRED');
    }

    const client = await this.createClient(
      transaction.session,
      transaction.apiId,
      transaction.apiHash,
    );

    try {
      let me: Api.TypeUser;
      try {
        me = await client.signInUser(
          {
            apiId: transaction.apiId,
            apiHash: transaction.apiHash,
          },
          {
            phoneNumber: transaction.phoneNumber,
            phoneCode: () => Promise.resolve(payload.code),
            password: payload.password
              ? () => Promise.resolve(payload.password!)
              : undefined,
            onError: (err: Error) => {
              this.logger.warn(
                `Telegram signIn error for ${transaction.phoneNumber}: ${this.stringifyError(err)}`,
              );
              if (
                err.message.includes('PASSWORD') ||
                err.message.includes('password')
              ) {
                return Promise.resolve(false);
              }
              return Promise.resolve(true);
            },
          },
        );
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.includes('PASSWORD') ||
            error.message.includes('password'))
        ) {
          if (!payload.password) {
            throw new BadRequestException('PASSWORD_REQUIRED');
          }
          me = await client.signInWithPassword(
            {
              apiId: transaction.apiId,
              apiHash: transaction.apiHash,
            },
            {
              password: () => Promise.resolve(payload.password!),
              onError: (err: Error) => {
                this.logger.warn(
                  `Telegram password check failed for ${transaction.phoneNumber}: ${this.stringifyError(err)}`,
                );
                return Promise.resolve(true);
              },
            },
          );
        } else {
          this.logger.warn(
            `Telegram signIn failed for ${transaction.phoneNumber}: ${this.stringifyError(error)}`,
          );
          throw new BadRequestException(
            error instanceof Error ? error.message : 'TELEGRAM_SIGN_IN_FAILED',
          );
        }
      }

      const session = client.session.save() as unknown as string;

      await this.cache.del(this.buildCacheKey(payload.transactionId));

      const userId =
        typeof me.id === 'bigint'
          ? Number(me.id)
          : typeof me.id === 'number'
            ? me.id
            : 0;

      const username =
        me instanceof Api.User && me.username ? me.username : null;
      const phoneNumber = me instanceof Api.User && me.phone ? me.phone : null;

      await this.saveSession(session, userId, username, phoneNumber);

      return {
        session,
        expiresAt: null,
        userId,
        username,
        phoneNumber,
      };
    } finally {
      await client.disconnect();
    }
  }

  private async createClient(
    session: string,
    apiId: number,
    apiHash: string,
  ): Promise<TelegramClient> {
    const client = new TelegramClient(
      new StringSession(session),
      apiId,
      apiHash,
      {
        connectionRetries: 5,
      },
    );
    await client.connect();
    return client;
  }

  private buildCacheKey(transactionId: string): string {
    return `${CACHE_PREFIX}${transactionId}`;
  }

  private async saveSession(
    session: string,
    userId: number,
    username: string | null,
    phoneNumber: string | null,
  ): Promise<void> {
    await this.prisma.telegramSession.deleteMany({});
    await this.prisma.telegramSession.create({
      data: {
        session,
        userId: userId > 0 ? userId : null,
        username,
        phoneNumber,
      },
    });
    this.logger.log('Telegram session saved to database');
  }

  private async deleteExistingSession(): Promise<void> {
    const deleted = (await this.prisma.telegramSession.deleteMany({})) as {
      count: number;
    };
    if ((deleted as { count: number }).count > 0) {
      this.logger.log('Existing Telegram session deleted');
    }
  }

  private stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
}
