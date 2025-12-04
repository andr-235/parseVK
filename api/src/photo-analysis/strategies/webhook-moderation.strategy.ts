import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { request as httpRequest } from 'node:http';
import {
  request as httpsRequest,
  type RequestOptions as HttpsRequestOptions,
} from 'node:https';
import type { IModerationStrategy } from '../interfaces/moderation-service.interface';
import type { AppConfig } from '../../config/app.config';

const DEFAULT_IMAGE_MODERATION_WEBHOOK_URL =
  'https://192.168.88.12/webhook/image-moderation';

@Injectable()
export class WebhookModerationStrategy implements IModerationStrategy {
  private readonly logger = new Logger(WebhookModerationStrategy.name);

  constructor(private readonly configService: ConfigService<AppConfig>) {}

  async moderate(imageUrls: string[]): Promise<unknown[]> {
    const webhookUrl =
      this.configService.get('imageModerationWebhookUrl', { infer: true }) ??
      DEFAULT_IMAGE_MODERATION_WEBHOOK_URL;
    const allowSelfSignedEnv = this.configService.get(
      'imageModerationAllowSelfSigned',
      { infer: true },
    );
    const allowSelfSigned =
      typeof allowSelfSignedEnv === 'string'
        ? allowSelfSignedEnv.toLowerCase() === 'true'
        : webhookUrl === DEFAULT_IMAGE_MODERATION_WEBHOOK_URL;

    const payload = JSON.stringify({ imageUrls });

    const rawResponse = await this.sendModerationRequest({
      url: webhookUrl,
      payload,
      allowSelfSigned,
      imageCount: imageUrls.length,
    });

    let data: unknown;

    try {
      data = rawResponse.length ? JSON.parse(rawResponse) : null;
    } catch {
      throw new Error('Сервис модерации вернул некорректный JSON');
    }

    if (
      !data ||
      typeof data !== 'object' ||
      !Array.isArray((data as { results?: unknown[] }).results)
    ) {
      throw new Error('Ответ сервиса модерации не содержит массива results');
    }

    return ((data as { results?: unknown[] }).results as unknown[]) ?? [];
  }

  private async sendModerationRequest(params: {
    url: string;
    payload: string;
    allowSelfSigned: boolean;
    imageCount: number;
  }): Promise<string> {
    const targetUrl = new URL(params.url);
    const isHttps = targetUrl.protocol === 'https:';
    const requestFn = isHttps ? httpsRequest : httpRequest;
    const timeoutMs = this.resolveModerationTimeout();
    const timeoutLabel = timeoutMs === 0 ? 'без ограничения' : `${timeoutMs}мс`;

    this.logger.debug(
      `Запрос к модерации: изображений=${params.imageCount}, таймаут=${timeoutLabel}, url=${targetUrl.origin}`,
    );

    const options: HttpsRequestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(Buffer.byteLength(params.payload)),
      },
    };

    if (isHttps && params.allowSelfSigned) {
      options.rejectUnauthorized = false;
    }

    return new Promise<string>((resolve, reject) => {
      const request = requestFn(targetUrl, options, (response) => {
        let responseBody = '';

        response.setEncoding('utf8');
        response.on('data', (chunk: string) => {
          responseBody += chunk;
        });
        response.on('end', () => {
          const statusCode = response.statusCode ?? 0;
          const statusMessage = response.statusMessage ?? '';

          if (statusCode < 200 || statusCode >= 300) {
            reject(
              new Error(
                `Сервис модерации вернул статус ${statusCode}: ${statusMessage || 'Неизвестная ошибка'}`,
              ),
            );
            return;
          }

          resolve(responseBody);
        });
        response.on('error', (error) => {
          reject(
            new Error(
              `Ошибка чтения ответа сервиса модерации: ${error instanceof Error ? error.message : String(error)}`,
            ),
          );
        });
      });

      request.on('error', (error) => {
        reject(
          new Error(`Ошибка при запросе к сервису модерации: ${error.message}`),
        );
      });

      if (timeoutMs > 0 && Number.isFinite(timeoutMs)) {
        request.setTimeout(timeoutMs, () => {
          request.destroy(
            new Error(`Сервис модерации не ответил за ${timeoutMs}мс`),
          );
        });
      }

      request.write(params.payload);
      request.end();
    });
  }

  private resolveModerationTimeout(): number {
    const timeoutEnv = process.env.IMAGE_MODERATION_TIMEOUT_MS;

    if (timeoutEnv && timeoutEnv.trim().length > 0) {
      const normalized = timeoutEnv.trim().toLowerCase();

      if (
        ![
          '0',
          'off',
          'none',
          'no',
          'disable',
          'disabled',
          'infinite',
          'infinity',
          'unlimited',
        ].includes(normalized)
      ) {
        this.logger.warn(
          `Параметр IMAGE_MODERATION_TIMEOUT_MS=${timeoutEnv} игнорируется: ожидание ответа модерации без ограничения времени`,
        );
      }
    }

    const additionalTimeoutVars = [
      'IMAGE_MODERATION_BASE_TIMEOUT_MS',
      'IMAGE_MODERATION_TIMEOUT_PER_IMAGE_MS',
      'IMAGE_MODERATION_TIMEOUT_MAX_MS',
    ];

    for (const envName of additionalTimeoutVars) {
      const raw = process.env[envName];

      if (typeof raw === 'string' && raw.trim().length > 0) {
        this.logger.warn(
          `Параметр ${envName}=${raw} игнорируется: ожидание ответа модерации без ограничения времени`,
        );
      }
    }

    return 0;
  }
}
