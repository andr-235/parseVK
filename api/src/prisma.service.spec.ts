import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

const connectMock = jest.fn();
const disconnectMock = jest.fn();
const prismaClientConstructor = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: function (this: any, config: unknown) {
    prismaClientConstructor(config);
    this.$connect = connectMock;
    this.$disconnect = disconnectMock;
  },
}));

describe('PrismaService', () => {
  beforeEach(() => {
    connectMock.mockClear();
    disconnectMock.mockClear();
    prismaClientConstructor.mockClear();
  });

  it('должен пробрасывать конфигурацию в super и инициировать подключение', async () => {
    const databaseUrl = 'postgres://user:password@localhost:5432/db';
    const configService = {
      get: jest.fn().mockReturnValue(databaseUrl),
    } as unknown as ConfigService;

    const service = new PrismaService(configService);

    expect(configService.get).toHaveBeenCalledWith('DATABASE_URL');
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
