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

    const { status, message, error } = this.extractExceptionInfo(
      exception,
      request,
    );

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

  /**
   * Извлекает информацию об исключении
   */
  private extractExceptionInfo(
    exception: unknown,
    request: Request,
  ): {
    status: number;
    message: string | string[];
    error?: string;
  } {
    if (exception instanceof HttpException) {
      return this.extractHttpExceptionInfo(exception);
    }

    if (exception instanceof Error) {
      this.logger.error(
        `Необработанная ошибка: ${exception.message}`,
        exception.stack,
        `${request.method} ${request.url}`,
      );
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message,
      };
    }

    const errorString = String(exception);
    this.logger.error(
      `Необработанная ошибка неизвестного типа: ${errorString}`,
      undefined,
      `${request.method} ${request.url}`,
    );
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Произошла непредвиденная ошибка',
    };
  }

  /**
   * Извлекает информацию из HttpException
   */
  private extractHttpExceptionInfo(exception: HttpException): {
    status: number;
    message: string | string[];
    error?: string;
  } {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const defaultMessage = 'Внутренняя ошибка сервера';

    if (typeof exceptionResponse === 'string') {
      return {
        status,
        message: exceptionResponse,
      };
    }

    if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse as {
        message?: string | string[];
        error?: string;
        errors?: unknown;
      };
      return {
        status,
        message: responseObj.message ?? defaultMessage,
        error: responseObj.error,
      };
    }

    return {
      status,
      message: defaultMessage,
    };
  }
}
