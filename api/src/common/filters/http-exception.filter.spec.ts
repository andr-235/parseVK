import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let host: ArgumentsHost;
  let request: {
    method: string;
    url: string;
  };
  let response: {
    status: jest.Mock;
    json: jest.Mock;
  };
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    request = {
      method: 'GET',
      url: '/test',
    };

    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const httpContext = {
      getRequest: () => request,
      getResponse: () => response,
    };

    host = {
      switchToHttp: jest.fn().mockReturnValue(httpContext),
    } as unknown as ArgumentsHost;

    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('обрабатывает HttpException со строковым сообщением', () => {
    const exception = new NotFoundException('Ресурс не найден');

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        timestamp: expect.any(String),
        path: '/test',
        method: 'GET',
        message: ['Ресурс не найден'],
      }),
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('обрабатывает HttpException с объектным ответом', () => {
    const exception = new BadRequestException({
      message: ['Поле email обязательно', 'Поле name обязательно'],
      error: 'Bad Request',
    });

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: expect.any(String),
      path: '/test',
      method: 'GET',
      message: ['Поле email обязательно', 'Поле name обязательно'],
      error: 'Bad Request',
    });
  });

  it('обрабатывает HttpException с массивом сообщений', () => {
    const exception = new BadRequestException({
      message: ['Ошибка 1', 'Ошибка 2'],
    });

    filter.catch(exception, host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: ['Ошибка 1', 'Ошибка 2'],
      }),
    );
  });

  it('обрабатывает обычную Error', () => {
    const exception = new Error('Внутренняя ошибка');
    exception.stack = 'stack trace';

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: expect.any(String),
      path: '/test',
      method: 'GET',
      message: ['Внутренняя ошибка'],
    });
    expect(errorSpy).toHaveBeenCalledWith(
      'Необработанная ошибка: Внутренняя ошибка',
      'stack trace',
      'GET /test',
    );
  });

  it('обрабатывает неизвестный тип ошибки', () => {
    const exception = { someProperty: 'value' };

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: expect.any(String),
      path: '/test',
      method: 'GET',
      message: ['Внутренняя ошибка сервера'],
    });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Необработанная ошибка неизвестного типа'),
      undefined,
      'GET /test',
    );
  });

  it('преобразует строковое сообщение в массив', () => {
    const exception = new HttpException(
      'Простая ошибка',
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: ['Простая ошибка'],
      }),
    );
  });

  it('использует дефолтное сообщение для HttpException без message', () => {
    const exception = new HttpException(
      { error: 'Error' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: ['Внутренняя ошибка сервера'],
        error: 'Error',
      }),
    );
  });
});
