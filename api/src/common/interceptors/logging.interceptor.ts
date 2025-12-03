import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware';

interface LogEntry {
  correlationId: string;
  method: string;
  url: string;
  ip?: string;
  userAgent?: string;
  statusCode?: number;
  contentLength?: string;
  duration?: number;
  error?: string;
  timestamp: string;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');
  private readonly isProduction = process.env.NODE_ENV === 'production';

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, originalUrl, ip } = request;
    const userAgent = request.get('user-agent') ?? '';
    const correlationId =
      (request.headers[CORRELATION_ID_HEADER] as string) || 'unknown';
    const startedAt = Date.now();

    const logEntry: LogEntry = {
      correlationId,
      method,
      url: originalUrl,
      ip,
      userAgent: userAgent || undefined,
      timestamp: new Date().toISOString(),
    };

    if (this.isProduction) {
      this.logger.log(JSON.stringify({ ...logEntry, event: 'request' }));
    } else {
      this.logger.log(
        `[${correlationId}] Запрос: ${method} ${originalUrl} — UA: ${userAgent || 'неизвестно'} — IP: ${ip}`,
      );
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startedAt;
          const contentLength = response.get('content-length') ?? '0';
          const responseLog: LogEntry = {
            ...logEntry,
            statusCode: response.statusCode,
            contentLength,
            duration,
          };

          if (this.isProduction) {
            this.logger.log(
              JSON.stringify({ ...responseLog, event: 'response' }),
            );
          } else {
            this.logger.log(
              `[${correlationId}] Ответ: ${method} ${originalUrl} — статус ${response.statusCode} — ${contentLength}b — ${duration}мс`,
            );
          }
        },
        error: (error: Error) => {
          const duration = Date.now() - startedAt;
          const errorLog: LogEntry = {
            ...logEntry,
            statusCode: response.statusCode,
            duration,
            error: error.message,
          };

          if (this.isProduction) {
            this.logger.error(
              JSON.stringify({
                ...errorLog,
                event: 'error',
                stack: error.stack,
              }),
            );
          } else {
            this.logger.error(
              `[${correlationId}] Ошибка: ${method} ${originalUrl} — статус ${response.statusCode} — ${duration}мс — ${error.message}`,
              error.stack,
            );
          }
        },
      }),
    );
  }
}
