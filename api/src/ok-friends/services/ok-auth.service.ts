import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/app.config.js';

export interface OkCredentials {
  accessToken: string;
  applicationKey: string;
  applicationSecretKey: string;
}

/**
 * Сервис управления учётными данными OK API.
 *
 * Читает конфигурацию из env, валидирует при старте.
 * Остальные OK API сервисы получают credentials через этот сервис.
 */
@Injectable()
export class OkAuthService {
  private readonly logger = new Logger(OkAuthService.name);
  readonly accessToken: string;
  readonly applicationKey: string;
  readonly applicationSecretKey: string;

  constructor(private readonly configService: ConfigService<AppConfig>) {
    this.accessToken =
      this.configService.get('okAccessToken', { infer: true }) ?? '';
    this.applicationKey =
      this.configService.get('okApplicationKey', { infer: true }) ?? '';
    this.applicationSecretKey =
      this.configService.get('okApplicationSecretKey', { infer: true }) ?? '';

    this.validateCredentials();
  }

  getCredentials(): OkCredentials {
    return {
      accessToken: this.accessToken,
      applicationKey: this.applicationKey,
      applicationSecretKey: this.applicationSecretKey,
    };
  }

  assertCredentialsAvailable(): void {
    if (!this.applicationKey) {
      this.logger.error('OK_APPLICATION_KEY is not set!');
      throw new Error('OK_APPLICATION_KEY is not configured');
    }
    if (!this.accessToken) {
      this.logger.error('OK_ACCESS_TOKEN (вечный session_key) is not set!');
      throw new Error('OK_ACCESS_TOKEN (вечный session_key) is not configured');
    }
    if (!this.applicationSecretKey) {
      this.logger.error('OK_APPLICATION_SECRET_KEY is not set!');
      throw new Error('OK_APPLICATION_SECRET_KEY is not configured');
    }
  }

  private validateCredentials(): void {
    // Валидация application_key — не должен содержать кириллицу
    if (this.applicationKey && /[А-Яа-яЁё]/.test(this.applicationKey)) {
      this.logger.error(
        `OK_APPLICATION_KEY contains Cyrillic characters! Current value: ${this.applicationKey}. This is invalid. Please update OK_APPLICATION_KEY to the correct value without Cyrillic characters.`,
      );
      throw new Error(
        'OK_APPLICATION_KEY contains invalid characters (Cyrillic). Please update the environment variable.',
      );
    }

    this.logger.log(
      `[OK API INIT] accessToken=${this.accessToken ? `set (length: ${this.accessToken.length}, starts with: ${this.accessToken.substring(0, 5)})` : 'NOT SET'}`,
    );
    this.logger.log(
      `[OK API INIT] applicationKey=${this.applicationKey ? `set (${this.applicationKey})` : 'NOT SET'}`,
    );
    this.logger.log(
      `[OK API INIT] applicationSecretKey=${this.applicationSecretKey ? `set (length: ${this.applicationSecretKey.length})` : 'NOT SET'}`,
    );

    if (
      !this.accessToken ||
      !this.applicationKey ||
      !this.applicationSecretKey
    ) {
      this.logger.error(
        'OK API credentials not configured. Set OK_ACCESS_TOKEN (вечный session_key), OK_APPLICATION_KEY, OK_APPLICATION_SECRET_KEY',
      );
      this.logger.error(
        `Current values: accessToken=${this.accessToken ? 'set' : 'empty'}, applicationKey=${this.applicationKey || 'empty'}, applicationSecretKey=${this.applicationSecretKey ? 'set' : 'empty'}`,
      );
    }
  }
}
