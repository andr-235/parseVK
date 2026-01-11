import { BadRequestException } from '@nestjs/common';
import { TelegramAuthService } from './telegram-auth.service';
import { Api } from 'telegram';
import type { ITelegramAuthRepository } from './interfaces/telegram-auth-repository.interface';

const createCacheMock = () => {
  const store = new Map<string, unknown>();
  return {
    get: jest.fn((key: string) => Promise.resolve(store.get(key))),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    set: jest.fn((key: string, value: unknown, ttl?: number) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    del: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
  };
};

describe('TelegramAuthService', () => {
  const configMock = {
    get: jest.fn((key: string) => {
      if (key === 'telegramApiId') {
        return 123456;
      }
      if (key === 'telegramApiHash') {
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
    const repositoryMock = {
      findLatestSettings: jest.fn(),
      upsertSettings: jest.fn(),
      findLatestSession: jest.fn(),
      replaceSession: jest.fn(),
      deleteAllSessions: jest.fn().mockResolvedValue(0),
    } as unknown as ITelegramAuthRepository;
    const service = new TelegramAuthService(
      configMock as never,
      cache as never,
      repositoryMock,
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

    (service as unknown as { createClient: jest.Mock }).createClient = jest
      .fn()
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
    const calls = (cache.set as jest.Mock).mock.calls;
    const [cacheKey, cacheValue] = calls[0] as [string, unknown];
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
    const repositoryMock = {
      findLatestSettings: jest.fn(),
      upsertSettings: jest.fn(),
      findLatestSession: jest.fn(),
      replaceSession: jest.fn(),
      deleteAllSessions: jest.fn().mockResolvedValue(0),
    } as unknown as ITelegramAuthRepository;
    const service = new TelegramAuthService(
      configMock as never,
      cache as never,
      repositoryMock,
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
    } as unknown as ConstructorParameters<typeof Api.User>[0]);

    const clientMock = {
      signInUser: jest.fn().mockResolvedValue(userMock),
      getMe: jest.fn().mockResolvedValue(userMock),
      session: { save: jest.fn().mockReturnValue('final-session') },
      disconnect: jest.fn().mockResolvedValue(undefined),
    } as unknown as Record<string, unknown>;

    (service as unknown as { createClient: jest.Mock }).createClient = jest
      .fn()
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
    expect(
      (service as unknown as { createClient: jest.Mock }).createClient,
    ).toHaveBeenCalledWith('temp-session', 123456, 'hash');
    expect(result.session).toBe('final-session');
    expect(result.userId).toBe(123);
    expect(result.username).toBe('user123');
    expect(cache.del).toHaveBeenCalledWith(`telegram:auth:tx:${transactionId}`);
  });

  it('uses provided apiId and apiHash instead of env', async () => {
    const cache = createCacheMock();
    const repositoryMock = {
      findLatestSettings: jest.fn(),
      upsertSettings: jest.fn(),
      findLatestSession: jest.fn(),
      replaceSession: jest.fn(),
      deleteAllSessions: jest.fn().mockResolvedValue(0),
    } as unknown as ITelegramAuthRepository;
    const service = new TelegramAuthService(
      configMock as never,
      cache as never,
      repositoryMock,
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

    (service as unknown as { createClient: jest.Mock }).createClient = jest
      .fn()
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
    const calls = (cache.set as jest.Mock).mock.calls;
    const [, cacheValue] = calls[0] as [string, unknown];
    expect(cacheValue).toMatchObject({
      apiId: 999999,
      apiHash: 'custom-hash',
    });
  });

  it('throws error when apiId and apiHash are missing', async () => {
    const cache = createCacheMock();
    const repositoryMock = {
      findLatestSettings: jest.fn(),
      upsertSettings: jest.fn(),
      findLatestSession: jest.fn(),
      replaceSession: jest.fn(),
      deleteAllSessions: jest.fn().mockResolvedValue(0),
    } as unknown as ITelegramAuthRepository;
    const configWithoutApi = {
      get: jest.fn(() => undefined),
    };
    const service = new TelegramAuthService(
      configWithoutApi as never,
      cache as never,
      repositoryMock,
    );

    await expect(
      service.startSession({ phoneNumber: '+79998887766' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires password when session password needed', async () => {
    const cache = createCacheMock();
    const repositoryMock = {
      findLatestSettings: jest.fn(),
      upsertSettings: jest.fn(),
      findLatestSession: jest.fn(),
      replaceSession: jest.fn(),
      deleteAllSessions: jest.fn().mockResolvedValue(0),
    } as unknown as ITelegramAuthRepository;
    const service = new TelegramAuthService(
      configMock as never,
      cache as never,
      repositoryMock,
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

    (service as unknown as { createClient: jest.Mock }).createClient = jest
      .fn()
      .mockResolvedValue(clientMock);

    await expect(
      service.confirmSession({
        transactionId,
        code: '1234',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
