import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();
    const { method, originalUrl } = request;
    const startedAt = Date.now();

    this.logger.log(`Запрос ${method} ${originalUrl}`);

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            `Ответ ${method} ${originalUrl} со статусом ${response.statusCode} за ${Date.now() - startedAt}мс`,
          );
        },
        error: (error: unknown) => {
          const statusFromError =
            typeof error === 'object' && error !== null && 'status' in error
              ? Number((error as Record<string, unknown>).status)
              : undefined;
          const messageFromError =
            typeof error === 'object' && error !== null && 'message' in error
              ? String((error as Record<string, unknown>).message)
              : 'Неизвестная ошибка';
          const stackFromError =
            typeof error === 'object' && error !== null && 'stack' in error
              ? String((error as Record<string, unknown>).stack)
              : undefined;

          const status = response.statusCode || statusFromError || 500;

          this.logger.error(
            `Ошибка ${method} ${originalUrl} со статусом ${status}: ${messageFromError}`,
            stackFromError,
          );
        },
      }),
    );
  }
}
