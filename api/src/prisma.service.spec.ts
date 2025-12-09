import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('должен выбрасывать исключение при отсутствии DATABASE_URL', () => {
    const configService = {
      get: jest.fn<string | undefined, [string]>().mockReturnValue(undefined),
    } as unknown as ConfigService;

    expect(() => new PrismaService(configService)).toThrow(
      'DATABASE_URL is not defined. Please set it in your environment variables.',
    );
  });
});
