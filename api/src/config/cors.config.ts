import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CorsOptions } from 'cors';
import type { Request } from 'express';
import type { AppConfig } from './app.config.js';

export type CorsOptionsDelegate = (
  req: Request,
  cb: (err: Error | null, options?: CorsOptions) => void,
) => void;

/**
 * Сервис CORS-конфигурации.
 *
 * Читает разрешённые origins из env и строит delegate-функцию для enableCors().
 * Поддерживает два режима: обычные запросы и запросы с credentials (для авторизованных маршрутов).
 */
@Injectable()
export class CorsConfigService {
  private readonly logger = new Logger(CorsConfigService.name);

  private readonly allowedOrigins: Set<string>;
  private readonly credentialedOrigins: Set<string>;
  private readonly credentialedRoutes: string[];

  private static readonly API_PREFIX = 'api';
  private static readonly ALLOWED_METHODS = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
  ];
  private static readonly ALLOWED_HEADERS = ['Content-Type', 'Authorization'];

  constructor(configService: ConfigService<AppConfig>) {
    const credOrigins = CorsConfigService.parseList(
      configService.get('corsCredentialsOrigins', { infer: true }),
    );
    const origins = CorsConfigService.parseList(
      configService.get('corsOrigins', { infer: true }),
    );
    const credRoutes = CorsConfigService.parseList(
      configService.get('corsCredentialsRoutes', { infer: true }),
    );

    this.credentialedOrigins = new Set(credOrigins);
    this.allowedOrigins = new Set([...origins, ...credOrigins]);
    this.credentialedRoutes = credRoutes.map((r) =>
      CorsConfigService.normalizeRoute(r),
    );

    this.logConfiguration();
  }

  buildDelegate(): CorsOptionsDelegate {
    const noCredOptions = this.buildOptions(this.allowedOrigins, false);
    const credOptions = this.buildOptions(this.credentialedOrigins, true);
    const credOrigins = this.credentialedOrigins;
    const credRoutes = this.credentialedRoutes;

    return (
      req: Request,
      callback: (err: Error | null, options?: CorsOptions) => void,
    ) => {
      const origin = req.get('origin');
      const path = typeof req.path === 'string' ? req.path : '';

      const useCredentials =
        credOrigins.size > 0 &&
        credRoutes.length > 0 &&
        !!origin &&
        credRoutes.some((route) => path.startsWith(route)) &&
        credOrigins.has(origin);

      callback(null, useCredentials ? credOptions : noCredOptions);
    };
  }

  private buildOptions(
    origins: Set<string>,
    credentials: boolean,
  ): CorsOptions {
    return {
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (origins.has(origin)) {
          callback(null, true);
          return;
        }
        this.logger.warn(`CORS заблокирован для origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      },
      credentials,
      methods: CorsConfigService.ALLOWED_METHODS,
      allowedHeaders: CorsConfigService.ALLOWED_HEADERS,
    };
  }

  private logConfiguration(): void {
    if (this.allowedOrigins.size > 0) {
      this.logger.log(
        `CORS allow-list: ${Array.from(this.allowedOrigins).join(', ')}`,
      );
    } else {
      this.logger.warn(
        'CORS allow-list пуст: кросс-доменные запросы будут блокироваться',
      );
    }

    if (
      this.credentialedOrigins.size > 0 &&
      this.credentialedRoutes.length === 0
    ) {
      this.logger.warn(
        'CORS credentials routes заданы, но список origins пуст — credentials отключены',
      );
    }
    if (this.credentialedOrigins.size > 0) {
      this.logger.log(
        `CORS credentials allow-list: ${Array.from(this.credentialedOrigins).join(', ')}`,
      );
    }
    if (this.credentialedRoutes.length > 0) {
      this.logger.log(
        `CORS credentials routes: ${this.credentialedRoutes.join(', ')}`,
      );
    }
  }

  private static parseList(value?: string): string[] {
    if (!value) return [];
    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private static normalizeRoute(route: string): string {
    const normalized = route.startsWith('/') ? route : `/${route}`;
    const prefix = `/${CorsConfigService.API_PREFIX}`;
    if (normalized.startsWith(`${prefix}/`) || normalized === prefix) {
      return normalized;
    }
    return `${prefix}${normalized}`;
  }
}
