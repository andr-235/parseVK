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
  createdAt: string;
}

const CACHE_PREFIX = 'telegram:auth:tx:';
const DEFAULT_CODE_LENGTH = 5;
const TRANSACTION_TTL_SEC = 5 * 60;

@Injectable()
export class TelegramAuthService {
  private readonly logger = new Logger(TelegramAuthService.name);
  private readonly apiId: number;
  private readonly apiHash: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {
    const apiIdRaw = this.configService.get<string | number>('TELEGRAM_API_ID');
    const apiHash = this.configService.get<string>('TELEGRAM_API_HASH');

    const parsedApiId =
      typeof apiIdRaw === 'string' ? Number.parseInt(apiIdRaw, 10) : apiIdRaw;

    if (!parsedApiId || Number.isNaN(parsedApiId)) {
      throw new InternalServerErrorException('TELEGRAM_API_ID is missing');
    }

    if (!apiHash) {
      throw new InternalServerErrorException('TELEGRAM_API_HASH is missing');
    }

    this.apiId = parsedApiId;
    this.apiHash = apiHash;
  }

  async startSession(
    payload: StartTelegramSessionDto,
  ): Promise<StartTelegramSessionResponseDto> {
    const phoneNumber = payload.phoneNumber.trim();
    if (!phoneNumber) {
      throw new BadRequestException('PHONE_NUMBER_REQUIRED');
    }

    const client = await this.createClient('');

    try {
      const response = await client.sendCode(
        {
          apiId: this.apiId,
          apiHash: this.apiHash,
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

  async confirmSession(
    payload: ConfirmTelegramSessionDto,
  ): Promise<ConfirmTelegramSessionResponseDto> {
    const transaction = await this.cache.get<AuthTransactionState>(
      this.buildCacheKey(payload.transactionId),
    );

    if (!transaction) {
      throw new BadRequestException('TRANSACTION_NOT_FOUND_OR_EXPIRED');
    }

    const client = await this.createClient(transaction.session);

    try {
      let me: Api.TypeUser;
      try {
        me = await client.signInUser(
          {
            apiId: this.apiId,
            apiHash: this.apiHash,
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
              apiId: this.apiId,
              apiHash: this.apiHash,
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

  private async createClient(session: string): Promise<TelegramClient> {
    const client = new TelegramClient(
      new StringSession(session),
      this.apiId,
      this.apiHash,
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

