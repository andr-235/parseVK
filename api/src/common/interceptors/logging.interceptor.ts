import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
  Optional,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware';
import type { MetricsService } from '../../metrics/metrics.service';

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

  constructor(
    @Optional()
    @Inject('MetricsService')
    private readonly metricsService?: MetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const logEntry = this.createLogEntry(request);
    const startedAt = Date.now();

    this.logRequest(logEntry);

    return next.handle().pipe(
      tap({
        next: () => this.logResponse(logEntry, request, response, startedAt),
        error: (error: Error) =>
          this.logError(logEntry, request, response, error, startedAt),
      }),
    );
  }

  /**
   * Создает базовую запись лога из запроса
   */
  private createLogEntry(request: Request): LogEntry {
    const correlationId =
      (request.headers[CORRELATION_ID_HEADER] as string) || 'unknown';
    const userAgent = request.get('user-agent') ?? '';

    return {
      correlationId,
      method: request.method,
      url: request.originalUrl,
      ip: request.ip,
      userAgent: userAgent || undefined,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Логирует входящий запрос
   */
  private logRequest(logEntry: LogEntry): void {
    if (this.isProduction) {
      this.logger.log(JSON.stringify({ ...logEntry, event: 'request' }));
    } else {
      this.logger.log(
        `[${logEntry.correlationId}] Запрос: ${logEntry.method} ${logEntry.url} — UA: ${logEntry.userAgent || 'неизвестно'} — IP: ${logEntry.ip}`,
      );
    }
  }

  /**
   * Логирует успешный ответ
   */
  private logResponse(
    logEntry: LogEntry,
    request: Request,
    response: Response,
    startedAt: number,
  ): void {
    const duration = Date.now() - startedAt;
    const contentLength = response.get('content-length') ?? '0';
    const responseLog: LogEntry = {
      ...logEntry,
      statusCode: response.statusCode,
      contentLength,
      duration,
    };

    if (this.metricsService) {
      this.metricsService.recordHttpRequest(
        request.method,
        request.originalUrl,
        response.statusCode,
        duration,
      );
    }

    if (this.isProduction) {
      this.logger.log(JSON.stringify({ ...responseLog, event: 'response' }));
    } else {
      this.logger.log(
        `[${logEntry.correlationId}] Ответ: ${logEntry.method} ${logEntry.url} — статус ${response.statusCode} — ${contentLength}b — ${duration}мс`,
      );
    }
  }

  /**
   * Логирует ошибку
   */
  private logError(
    logEntry: LogEntry,
    request: Request,
    response: Response,
    error: Error,
    startedAt: number,
  ): void {
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
        `[${logEntry.correlationId}] Ошибка: ${logEntry.method} ${logEntry.url} — статус ${response.statusCode} — ${duration}мс — ${error.message}`,
        error.stack,
      );
    }
  }
}
