import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Внутренняя ошибка сервера';
    let error: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as {
          message?: string | string[];
          error?: string;
          errors?: unknown;
        };
        message = responseObj.message ?? message;
        error = responseObj.error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Необработанная ошибка: ${exception.message}`,
        exception.stack,
        `${request.method} ${request.url}`,
      );
    } else {
      const errorString = String(exception);
      message = 'Произошла непредвиденная ошибка';
      this.logger.error(
        `Необработанная ошибка неизвестного типа: ${errorString}`,
        undefined,
        `${request.method} ${request.url}`,
      );
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: Array.isArray(message) ? message : [message],
      ...(error && { error }),
    };

    response.status(status).json(errorResponse);
  }
}
