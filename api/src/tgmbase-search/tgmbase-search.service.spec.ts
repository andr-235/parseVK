import { describe, expect, it, vi } from 'vitest';
import { TgmbaseSearchMapper } from './mappers/tgmbase-search.mapper.js';
import { TgmbaseSearchService } from './tgmbase-search.service.js';

const createPrismaMock = () => ({
  user: {
    findMany: vi.fn(),
  },
  message: {
    groupBy: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
  },
  group: {
    findMany: vi.fn(),
  },
  supergroup: {
    findMany: vi.fn(),
  },
  channel: {
    findMany: vi.fn(),
  },
  $queryRaw: vi.fn(),
});

describe('TgmbaseSearchService', () => {
  it('returns invalid for empty input', async () => {
    const prisma = createPrismaMock();
    const service = new TgmbaseSearchService(
      prisma as never,
      new TgmbaseSearchMapper(),
    );

    const result = await service.search({ queries: ['   '] });

    expect(result.summary.invalid).toBe(1);
    expect(result.items[0]).toMatchObject({
      status: 'invalid',
      queryType: 'invalid',
    });
  });

  it('returns ambiguous when several users match the same username', async () => {
    const prisma = createPrismaMock();
    prisma.user.findMany.mockResolvedValue([
      {
        id: 1n,
        user_id: 111n,
        bot: false,
        scam: false,
        premium: false,
        first_name: 'Ivan',
        last_name: null,
        username: 'sample',
        phone: null,
        upd_date: new Date('2024-06-01T00:00:00.000Z'),
      },
      {
        id: 2n,
        user_id: 222n,
        bot: false,
        scam: false,
        premium: false,
        first_name: 'Petr',
        last_name: null,
        username: 'sample',
        phone: null,
        upd_date: new Date('2024-06-01T00:00:00.000Z'),
      },
    ]);

    const service = new TgmbaseSearchService(
      prisma as never,
      new TgmbaseSearchMapper(),
    );

    const result = await service.search({ queries: ['@sample'] });

    expect(result.summary.ambiguous).toBe(1);
    expect(result.items[0].status).toBe('ambiguous');
    expect(result.items[0].candidates).toHaveLength(2);
  });
});
