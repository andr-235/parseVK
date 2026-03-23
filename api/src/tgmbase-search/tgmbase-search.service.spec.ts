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
  it('publishes websocket progress for searchId', async () => {
    const prisma = createPrismaMock();
    prisma.user.findMany.mockResolvedValue([]);
    const gateway = {
      broadcastProgress: vi.fn(),
    };

    const service = new TgmbaseSearchService(
      prisma as never,
      new TgmbaseSearchMapper(),
      gateway as never,
    );

    await service.search({
      queries: Array.from({ length: 201 }, (_, index) => `${index + 1}`),
      searchId: 'search-1',
    });

    expect(gateway.broadcastProgress).toHaveBeenCalled();

    const payloads = gateway.broadcastProgress.mock.calls.map(
      ([payload]) => payload,
    );

    expect(payloads[0]).toMatchObject({
      searchId: 'search-1',
      status: 'started',
      totalQueries: 201,
      totalBatches: 2,
      batchSize: 200,
    });
    expect(payloads).toContainEqual(
      expect.objectContaining({
        searchId: 'search-1',
        status: 'progress',
        processedQueries: 200,
        totalQueries: 201,
        currentBatch: 1,
        totalBatches: 2,
      }),
    );
    expect(payloads.at(-1)).toMatchObject({
      searchId: 'search-1',
      status: 'completed',
      processedQueries: 201,
      totalQueries: 201,
      currentBatch: 2,
      totalBatches: 2,
    });
  });

  it('processes queries in internal batches of 200', async () => {
    const prisma = createPrismaMock();
    let resolveFirstBatch!: (value: []) => void;
    const firstBatchPromise = new Promise<[]>((resolve) => {
      resolveFirstBatch = resolve;
    });

    prisma.user.findMany.mockImplementation(() => {
      if (prisma.user.findMany.mock.calls.length <= 200) {
        return firstBatchPromise;
      }

      return Promise.resolve([]);
    });

    const service = new TgmbaseSearchService(
      prisma as never,
      new TgmbaseSearchMapper(),
    );

    const searchPromise = service.search({
      queries: Array.from({ length: 201 }, (_, index) => `@sample${index}`),
    });

    await Promise.resolve();

    expect(prisma.user.findMany).toHaveBeenCalledTimes(200);

    resolveFirstBatch([]);

    const result = await searchPromise;

    expect(prisma.user.findMany).toHaveBeenCalledTimes(201);
    expect(result.summary.total).toBe(201);
    expect(result.summary.notFound).toBe(201);
    expect(result.items).toHaveLength(201);
  });

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
