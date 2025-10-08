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

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, originalUrl, ip } = request;
    const userAgent = request.get('user-agent') ?? '';
    const startedAt = Date.now();

    this.logger.log(
      `Запрос: ${method} ${originalUrl} — UA: ${userAgent || 'неизвестно'} — IP: ${ip}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startedAt;
          const contentLength = response.get('content-length') ?? '0';
          this.logger.log(
            `Ответ: ${method} ${originalUrl} — статус ${response.statusCode} — ${contentLength}b — ${duration}мс`,
          );
        },
        error: (error: Error) => {
          const duration = Date.now() - startedAt;
          this.logger.error(
            `Ошибка: ${method} ${originalUrl} — статус ${response.statusCode} — ${duration}мс — ${error.message}`,
            error.stack,
          );
        },
      }),
    );
  }
}
