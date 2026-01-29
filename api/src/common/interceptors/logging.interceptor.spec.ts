import { vi } from 'vitest';
import { CallHandler, ExecutionContext, Logger } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor.js';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware.js';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let context: ExecutionContext;
  let request: {
    method: string;
    originalUrl: string;
    ip: string;
    get: vi.Mock;
    headers: Record<string, string>;
  };
  let response: {
    statusCode: number;
    get: vi.Mock;
  };
  let logSpy: vi.SpyInstance;
  let errorSpy: vi.SpyInstance;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();

    request = {
      method: 'GET',
      originalUrl: '/test',
      ip: '127.0.0.1',
      get: vi.fn().mockReturnValue('jest-agent'),
      headers: {
        [CORRELATION_ID_HEADER]: 'test-correlation-id',
      },
    };

    response = {
      statusCode: 200,
      get: vi.fn().mockReturnValue('456'),
    };

    const httpContext = {
      getRequest: () => request,
      getResponse: () => response,
    };

    context = {
      switchToHttp: vi.fn().mockReturnValue(httpContext),
    } as unknown as ExecutionContext;

    logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(vi.fn());
    errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('логирует успешный ответ и пробрасывает данные дальше', async () => {
    const callHandler: CallHandler = {
      handle: vi.fn(() => of('ok')),
    };

    vi.spyOn(Date, 'now').mockReturnValueOnce(100).mockReturnValue(200);

    const result = await lastValueFrom(
      interceptor.intercept(context, callHandler),
    );

    expect(result).toBe('ok');
    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      '[test-correlation-id] Запрос: GET /test — UA: jest-agent — IP: 127.0.0.1',
    );
    expect(logSpy).toHaveBeenNthCalledWith(
      2,
      '[test-correlation-id] Ответ: GET /test — статус 200 — 456b — 100мс',
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('логирует ошибку и пробрасывает её дальше', async () => {
    const testError = new Error('fail');
    response.statusCode = 500;

    const callHandler: CallHandler = {
      handle: vi.fn(() => throwError(() => testError)),
    };

    vi.spyOn(Date, 'now').mockReturnValueOnce(100).mockReturnValue(250);

    await expect(
      lastValueFrom(interceptor.intercept(context, callHandler)),
    ).rejects.toThrow(testError);

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      '[test-correlation-id] Запрос: GET /test — UA: jest-agent — IP: 127.0.0.1',
    );
    expect(errorSpy).toHaveBeenCalledWith(
      '[test-correlation-id] Ошибка: GET /test — статус 500 — 150мс — fail',
      expect.any(String),
    );
  });
});
