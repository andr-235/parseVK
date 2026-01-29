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
    get: jest.Mock;
    headers: Record<string, string>;
  };
  let response: {
    statusCode: number;
    get: jest.Mock;
  };
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();

    request = {
      method: 'GET',
      originalUrl: '/test',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('jest-agent'),
      headers: {
        [CORRELATION_ID_HEADER]: 'test-correlation-id',
      },
    };

    response = {
      statusCode: 200,
      get: jest.fn().mockReturnValue('456'),
    };

    const httpContext = {
      getRequest: () => request,
      getResponse: () => response,
    };

    context = {
      switchToHttp: jest.fn().mockReturnValue(httpContext),
    } as unknown as ExecutionContext;

    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(jest.fn());
    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('логирует успешный ответ и пробрасывает данные дальше', async () => {
    const callHandler: CallHandler = {
      handle: jest.fn(() => of('ok')),
    };

    jest.spyOn(Date, 'now').mockReturnValueOnce(100).mockReturnValue(200);

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
      handle: jest.fn(() => throwError(() => testError)),
    };

    jest.spyOn(Date, 'now').mockReturnValueOnce(100).mockReturnValue(250);

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
