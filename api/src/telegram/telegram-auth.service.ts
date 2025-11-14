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
      const response = await client.sendCode({
        apiId: this.apiId,
        apiHash: this.apiHash,
        phoneNumber,
        settings: new Api.CodeSettings({
          allowFlashcall: false,
          allowAppHash: true,
        }),
      });

      const transactionId = randomUUID();
      const sessionString = client.session.save();

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
        codeLength: this.resolveCodeLength(response.type),
        nextType: this.resolveNextType(response.type),
        timeoutSec: response.timeout ?? null,
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
      try {
        await client.signIn({
          phoneNumber: transaction.phoneNumber,
          phoneCodeHash: transaction.phoneCodeHash,
          phoneCode: payload.code,
        });
      } catch (error) {
        if (
          error instanceof Error &&
          'errorMessage' in error &&
          (error as { errorMessage?: string }).errorMessage ===
            'SESSION_PASSWORD_NEEDED'
        ) {
          if (!payload.password) {
            throw new BadRequestException('PASSWORD_REQUIRED');
          }
          await client.checkPassword(payload.password);
        } else {
          this.logger.warn(
            `Telegram signIn failed for ${transaction.phoneNumber}: ${this.stringifyError(error)}`,
          );
          throw new BadRequestException(
            (error as { errorMessage?: string }).errorMessage ??
              'TELEGRAM_SIGN_IN_FAILED',
          );
        }
      }

      const session = client.session.save();
      const me = await client.getMe();

      await this.cache.del(this.buildCacheKey(payload.transactionId));

      return {
        session,
        expiresAt: null,
        userId: (me as { id: number }).id ?? 0,
        username:
          (me as { username?: string | null }).username?.toString() ?? null,
        phoneNumber:
          (me as { phone?: string | null }).phone?.toString() ?? null,
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

  private resolveCodeLength(type: Api.TypeSentCodeType | undefined): number {
    if (!type) {
      return DEFAULT_CODE_LENGTH;
    }

    if ('length' in type && typeof type.length === 'number') {
      return type.length;
    }

    return DEFAULT_CODE_LENGTH;
  }

  private resolveNextType(
    type: Api.TypeSentCodeType | undefined,
  ): 'app' | 'sms' | 'call' | 'flash' {
    if (!type) {
      return 'sms';
    }

    if (type instanceof Api.auth.SentCodeTypeApp) {
      return 'app';
    }
    if (type instanceof Api.auth.SentCodeTypeCall) {
      return 'call';
    }
    if (type instanceof Api.auth.SentCodeTypeFlashCall) {
      return 'flash';
    }
    return 'sms';
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

