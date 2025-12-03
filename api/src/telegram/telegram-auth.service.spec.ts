import { BadRequestException } from '@nestjs/common';
import { TelegramAuthService } from './telegram-auth.service';
import { Api } from 'telegram';

const createCacheMock = () => {
  const store = new Map<string, unknown>();
  return {
    get: jest.fn(async (key: string) => store.get(key)),
    set: jest.fn(async (key: string, value: unknown) => {
      store.set(key, value);
    }),
    del: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
};

describe('TelegramAuthService', () => {
  const configMock = {
    get: jest.fn((key: string) => {
      if (key === 'TELEGRAM_API_ID') {
        return 123456;
      }
      if (key === 'TELEGRAM_API_HASH') {
        return 'hash';
      }
      return undefined;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts session and stores transaction', async () => {
    const cache = createCacheMock();
    const service = new TelegramAuthService(
      configMock as never,
      cache as never,
    );

    const sendCodeResponse = {
      phoneCodeHash: 'hash123',
      isCodeViaApp: false,
    };

    const clientMock = {
      sendCode: jest.fn().mockResolvedValue(sendCodeResponse),
      session: { save: jest.fn().mockReturnValue('temp-session') },
      disconnect: jest.fn().mockResolvedValue(undefined),
    } as unknown as Record<string, unknown>;

    jest
      .spyOn(service as unknown as Record<string, unknown>, 'createClient')
      .mockResolvedValue(clientMock);

    const result = await service.startSession({ phoneNumber: '+79998887766' });

    expect(clientMock.sendCode).toHaveBeenCalledWith(
      { apiId: 123456, apiHash: 'hash' },
      '+79998887766',
      false,
    );
    expect(result.codeLength).toBe(5);
    expect(result.nextType).toBe('sms');
    expect(cache.set).toHaveBeenCalledTimes(1);
    const [[cacheKey, cacheValue]] = (cache.set as jest.Mock).mock.calls;
    expect(cacheKey).toMatch(/^telegram:auth:tx:/);
    expect(cacheValue).toMatchObject({
      phoneNumber: '+79998887766',
      phoneCodeHash: 'hash123',
      session: 'temp-session',
      apiId: 123456,
      apiHash: 'hash',
    });
  });

  it('confirms session and returns final data', async () => {
    const cache = createCacheMock();
    const service = new TelegramAuthService(
      configMock as never,
      cache as never,
    );

    const transactionId = 'tx-1';
    await cache.set(
      `telegram:auth:tx:${transactionId}`,
      {
        phoneNumber: '+79998887766',
        phoneCodeHash: 'hash123',
        session: 'temp-session',
        apiId: 123456,
        apiHash: 'hash',
        createdAt: new Date().toISOString(),
      },
      300,
    );

    const userMock = new Api.User({
      id: BigInt(123),
      username: 'user123',
      phone: '+79998887766',
      firstName: 'Test',
      lastName: 'User',
    });

    const clientMock = {
      signInUser: jest.fn().mockResolvedValue(userMock),
      getMe: jest.fn().mockResolvedValue(userMock),
      session: { save: jest.fn().mockReturnValue('final-session') },
      disconnect: jest.fn().mockResolvedValue(undefined),
    } as unknown as Record<string, unknown>;

    jest
      .spyOn(service as unknown as Record<string, unknown>, 'createClient')
      .mockResolvedValue(clientMock);

    const result = await service.confirmSession({
      transactionId,
      code: '123456',
    });

    expect(clientMock.signInUser).toHaveBeenCalledWith(
      { apiId: 123456, apiHash: 'hash' },
      expect.objectContaining({
        phoneNumber: '+79998887766',
      }),
    );
    expect(service['createClient']).toHaveBeenCalledWith(
      'temp-session',
      123456,
      'hash',
    );
    expect(result.session).toBe('final-session');
    expect(result.userId).toBe(123);
    expect(result.username).toBe('user123');
    expect(cache.del).toHaveBeenCalledWith(`telegram:auth:tx:${transactionId}`);
  });

  it('uses provided apiId and apiHash instead of env', async () => {
    const cache = createCacheMock();
    const service = new TelegramAuthService(
      configMock as never,
      cache as never,
    );

    const sendCodeResponse = {
      phoneCodeHash: 'hash123',
      isCodeViaApp: false,
    };

    const clientMock = {
      sendCode: jest.fn().mockResolvedValue(sendCodeResponse),
      session: { save: jest.fn().mockReturnValue('temp-session') },
      disconnect: jest.fn().mockResolvedValue(undefined),
    } as unknown as Record<string, unknown>;

    jest
      .spyOn(service as unknown as Record<string, unknown>, 'createClient')
      .mockResolvedValue(clientMock);

    await service.startSession({
      phoneNumber: '+79998887766',
      apiId: 999999,
      apiHash: 'custom-hash',
    });

    expect(clientMock.sendCode).toHaveBeenCalledWith(
      { apiId: 999999, apiHash: 'custom-hash' },
      '+79998887766',
      false,
    );
    const [[, cacheValue]] = (cache.set as jest.Mock).mock.calls;
    expect(cacheValue).toMatchObject({
      apiId: 999999,
      apiHash: 'custom-hash',
    });
  });

  it('throws error when apiId and apiHash are missing', async () => {
    const cache = createCacheMock();
    const configWithoutApi = {
      get: jest.fn(() => undefined),
    };
    const service = new TelegramAuthService(
      configWithoutApi as never,
      cache as never,
    );

    await expect(
      service.startSession({ phoneNumber: '+79998887766' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires password when session password needed', async () => {
    const cache = createCacheMock();
    const service = new TelegramAuthService(
      configMock as never,
      cache as never,
    );
    const transactionId = 'tx-2';
    await cache.set(
      `telegram:auth:tx:${transactionId}`,
      {
        phoneNumber: '+79998887766',
        phoneCodeHash: 'hash123',
        session: 'temp-session',
        apiId: 123456,
        apiHash: 'hash',
        createdAt: new Date().toISOString(),
      },
      300,
    );

    const error = new Error('PASSWORD_REQUIRED');

    const clientMock = {
      signInUser: jest.fn().mockRejectedValue(error),
      signInWithPassword: jest.fn(),
      disconnect: jest.fn().mockResolvedValue(undefined),
      session: { save: jest.fn() },
    } as unknown as Record<string, unknown>;

    jest
      .spyOn(service as unknown as Record<string, unknown>, 'createClient')
      .mockResolvedValue(clientMock);

    await expect(
      service.confirmSession({
        transactionId,
        code: '1234',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
