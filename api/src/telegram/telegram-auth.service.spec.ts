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
    const service = new TelegramAuthService(configMock as never, cache as never);

    const sendCodeResponse = {
      phoneCodeHash: 'hash123',
      type: new Api.auth.SentCodeTypeSms({ length: 6 }),
      timeout: 20,
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

    expect(clientMock.sendCode).toHaveBeenCalledTimes(1);
    expect(result.codeLength).toBe(6);
    expect(result.nextType).toBe('sms');
    expect(cache.set).toHaveBeenCalledTimes(1);
    const [[cacheKey, cacheValue]] = (cache.set as jest.Mock).mock.calls;
    expect(cacheKey).toMatch(/^telegram:auth:tx:/);
    expect(cacheValue).toMatchObject({
      phoneNumber: '+79998887766',
      phoneCodeHash: 'hash123',
      session: 'temp-session',
    });
  });

  it('confirms session and returns final data', async () => {
    const cache = createCacheMock();
    const service = new TelegramAuthService(configMock as never, cache as never);

    const transactionId = 'tx-1';
    await cache.set(
      `telegram:auth:tx:${transactionId}`,
      {
        phoneNumber: '+79998887766',
        phoneCodeHash: 'hash123',
        session: 'temp-session',
        createdAt: new Date().toISOString(),
      },
      300,
    );

    const clientMock = {
      signIn: jest.fn().mockResolvedValue(undefined),
      checkPassword: jest.fn().mockResolvedValue(undefined),
      getMe: jest.fn().mockResolvedValue({
        id: 123,
        username: 'user123',
        phone: '+79998887766',
      }),
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

    expect(clientMock.signIn).toHaveBeenCalledWith({
      phoneCode: '123456',
      phoneCodeHash: 'hash123',
      phoneNumber: '+79998887766',
    });
    expect(result.session).toBe('final-session');
    expect(result.userId).toBe(123);
    expect(result.username).toBe('user123');
    expect(cache.del).toHaveBeenCalledWith(`telegram:auth:tx:${transactionId}`);
  });

  it('requires password when session password needed', async () => {
    const cache = createCacheMock();
    const service = new TelegramAuthService(configMock as never, cache as never);
    const transactionId = 'tx-2';
    await cache.set(
      `telegram:auth:tx:${transactionId}`,
      {
        phoneNumber: '+79998887766',
        phoneCodeHash: 'hash123',
        session: 'temp-session',
        createdAt: new Date().toISOString(),
      },
      300,
    );

    const error = Object.assign(new Error(''), { errorMessage: 'SESSION_PASSWORD_NEEDED' });

    const clientMock = {
      signIn: jest.fn().mockRejectedValue(error),
      checkPassword: jest.fn(),
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

