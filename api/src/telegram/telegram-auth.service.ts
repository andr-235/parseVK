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

  async startSession(
    payload: StartTelegramSessionDto,
  ): Promise<StartTelegramSessionResponseDto> {
    const phoneNumber = payload.phoneNumber.trim();
    if (!phoneNumber) {
      throw new BadRequestException('PHONE_NUMBER_REQUIRED');
    }

    const apiId = payload.apiId ?? this.defaultApiId;
    const apiHash = payload.apiHash ?? this.defaultApiHash;

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
      const sessionString = (client.session.save() as unknown) as string;

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
    const sessionRecord = await this.prisma.telegramSession.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!sessionRecord) {
      return null;
    }

    return {
      session: sessionRecord.session,
      expiresAt: null,
      userId: sessionRecord.userId ?? undefined,
      username: sessionRecord.username ?? undefined,
      phoneNumber: sessionRecord.phoneNumber ?? undefined,
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
            phoneCode: async () => payload.code,
            password: payload.password
              ? async () => payload.password!
              : undefined,
            onError: async (err: Error) => {
              this.logger.warn(
                `Telegram signIn error for ${transaction.phoneNumber}: ${this.stringifyError(err)}`,
              );
              if (
                err.message.includes('PASSWORD') ||
                err.message.includes('password')
              ) {
                return false;
              }
              return true;
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
              password: async () => payload.password!,
              onError: async (err: Error) => {
                this.logger.warn(
                  `Telegram password check failed for ${transaction.phoneNumber}: ${this.stringifyError(err)}`,
                );
                return true;
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

      const session = (client.session.save() as unknown) as string;

      await this.cache.del(this.buildCacheKey(payload.transactionId));

      const userId =
        typeof me.id === 'bigint' ? Number(me.id) : typeof me.id === 'number' ? me.id : 0;

      const username =
        me instanceof Api.User && me.username ? me.username : null;
      const phoneNumber =
        me instanceof Api.User && me.phone ? me.phone : null;

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
    const deleted = await this.prisma.telegramSession.deleteMany({});
    if (deleted.count > 0) {
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

