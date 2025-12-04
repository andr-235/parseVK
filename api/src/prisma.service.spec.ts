import { ConfigService } from '@nestjs/config';
import { __setPrismaMocks } from '@prisma/client';
import { PrismaService } from './prisma.service';

const connectMock = jest.fn();
const disconnectMock = jest.fn();
const prismaClientConstructor = jest.fn();

describe('PrismaService', () => {
  beforeEach(() => {
    connectMock.mockClear();
    disconnectMock.mockClear();
    prismaClientConstructor.mockClear();
    (
      __setPrismaMocks as (mocks?: {
        constructor?: () => void;
        connect?: () => Promise<void>;
        disconnect?: () => Promise<void>;
      }) => void
    )({
      constructor: prismaClientConstructor as unknown as () => void,
      connect: connectMock as unknown as () => Promise<void>,
      disconnect: disconnectMock as unknown as () => Promise<void>,
    });
  });

  afterEach(() => {
    (
      __setPrismaMocks as (mocks?: {
        constructor?: () => void;
        connect?: () => Promise<void>;
        disconnect?: () => Promise<void>;
      }) => void
    )(undefined);
  });

  it('должен пробрасывать конфигурацию в super и инициировать подключение', async () => {
    const databaseUrl = 'postgres://user:password@localhost:5432/db';
    const getMock = jest.fn().mockReturnValue(databaseUrl);
    const configService = {
      get: getMock,
    } as unknown as ConfigService;

    const service = new PrismaService(configService);

    expect(getMock).toHaveBeenCalledWith('DATABASE_URL');
    expect(prismaClientConstructor).toHaveBeenCalledWith({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    await service.onModuleInit();
    expect(connectMock).toHaveBeenCalledTimes(1);

    await service.onModuleDestroy();
    expect(disconnectMock).toHaveBeenCalledTimes(1);
  });

  it('должен выбрасывать исключение при отсутствии DATABASE_URL', () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    expect(() => new PrismaService(configService)).toThrow(
      'DATABASE_URL is not defined. Please set it in your environment variables.',
    );
    expect(prismaClientConstructor).not.toHaveBeenCalled();
  });
});
