import { Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { TelegramDlMatchService } from './telegram-dl-match.service.js';

const createPrismaMock = () => ({
  dlContact: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  user: {
    findMany: vi.fn(),
  },
  dlMatchRun: {
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  dlMatchResult: {
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
});

const createQueueProducerMock = () => ({
  enqueue: vi.fn(),
});

describe('TelegramDlMatchService', () => {
  it('creates run, enqueues background job and returns RUNNING immediately', async () => {
    const prisma = createPrismaMock();
    const queue = createQueueProducerMock();
    prisma.dlMatchRun.create.mockResolvedValue({
      id: 10n,
      status: 'RUNNING',
      contactsTotal: 0,
      matchesTotal: 0,
      strictMatchesTotal: 0,
      usernameMatchesTotal: 0,
      phoneMatchesTotal: 0,
      createdAt: new Date('2026-03-25T00:00:00.000Z'),
      finishedAt: null,
      error: null,
    });

    const service = new TelegramDlMatchService(
      prisma as never,
      {} as never,
      queue as never,
    );
    const run = await service.createRun();

    expect(run.status).toBe('RUNNING');
    expect(queue.enqueue).toHaveBeenCalledWith({ runId: '10' });
    expect(prisma.dlContact.findMany).not.toHaveBeenCalled();
  });

  it('processes contacts in batches and logs progress', async () => {
    const prisma = createPrismaMock();
    const queue = createQueueProducerMock();
    const logSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);

    prisma.dlMatchRun.update.mockImplementation(({ data }) => ({
      id: 10n,
      status: data.status ?? 'RUNNING',
      contactsTotal: data.contactsTotal ?? 0,
      matchesTotal: data.matchesTotal ?? 0,
      strictMatchesTotal: data.strictMatchesTotal ?? 0,
      usernameMatchesTotal: data.usernameMatchesTotal ?? 0,
      phoneMatchesTotal: data.phoneMatchesTotal ?? 0,
      finishedAt: data.finishedAt ?? null,
      error: data.error ?? null,
    }));
    prisma.dlContact.count.mockResolvedValue(2);
    prisma.dlContact.findMany
      .mockResolvedValueOnce([
        {
          id: 1n,
          importFileId: 1n,
          telegramId: '100',
          username: 'alpha',
          phone: '+70000000001',
          firstName: 'Alpha',
          lastName: 'One',
          fullName: 'Alpha One',
          region: 'Moscow',
          sourceRowIndex: 1,
          importFile: { originalFileName: 'dl-1.xlsx' },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 2n,
          importFileId: 2n,
          telegramId: '200',
          username: 'beta',
          phone: '+70000000002',
          firstName: 'Beta',
          lastName: 'Two',
          fullName: 'Beta Two',
          region: 'SPB',
          sourceRowIndex: 2,
          importFile: { originalFileName: 'dl-2.xlsx' },
        },
      ])
      .mockResolvedValueOnce([]);
    prisma.user.findMany
      .mockResolvedValueOnce([
        {
          user_id: 100n,
          bot: false,
          scam: false,
          premium: false,
          first_name: 'Alpha',
          last_name: 'One',
          username: 'alpha',
          phone: '+70000000001',
          upd_date: new Date('2026-03-25T00:00:00.000Z'),
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          user_id: 200n,
          bot: false,
          scam: false,
          premium: false,
          first_name: 'Beta',
          last_name: 'Two',
          username: 'beta',
          phone: '+70000000002',
          upd_date: new Date('2026-03-25T00:00:00.000Z'),
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    prisma.dlMatchResult.createMany.mockResolvedValue({ count: 1 });

    const service = new TelegramDlMatchService(
      prisma as never,
      {} as never,
      queue as never,
    );
    (
      service as unknown as {
        batchSize: number;
      }
    ).batchSize = 1;

    const run = await service.processRun('10');

    expect(run.status).toBe('DONE');
    expect(prisma.dlContact.findMany).toHaveBeenCalledTimes(3);
    expect(prisma.dlMatchResult.createMany).toHaveBeenCalledTimes(2);
    expect(prisma.dlMatchRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'RUNNING',
          contactsTotal: 1,
          matchesTotal: 1,
        }),
      }),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Матчинг DL batch'),
    );
    logSpy.mockRestore();
  });

  it('returns saved runs and results', async () => {
    const prisma = createPrismaMock();
    prisma.dlMatchRun.findMany.mockResolvedValue([
      { id: 1n, status: 'DONE', contactsTotal: 1, matchesTotal: 1 },
    ]);
    prisma.dlMatchRun.findUnique.mockResolvedValue({
      id: 1n,
      status: 'DONE',
      contactsTotal: 1,
      matchesTotal: 1,
    });
    prisma.dlMatchResult.findMany.mockResolvedValue([
      {
        id: 11n,
        runId: 1n,
        dlContactId: 21n,
        tgmbaseUserId: 31n,
        strictTelegramIdMatch: true,
        usernameMatch: false,
        phoneMatch: false,
        dlContactSnapshot: {
          telegramId: '123',
          username: 'alpha',
        },
        tgmbaseUserSnapshot: {
          user_id: '123',
          username: 'alpha',
        },
        createdAt: new Date('2026-03-25T00:00:00.000Z'),
      },
    ]);

    const service = new TelegramDlMatchService(
      prisma as never,
      {} as never,
      createQueueProducerMock() as never,
    );

    await expect(service.getRuns()).resolves.toHaveLength(1);
    await expect(service.getRunById('1')).resolves.toMatchObject({
      id: '1',
      status: 'DONE',
    });
    await expect(service.getResults('1')).resolves.toHaveLength(1);
  });

  it('marks run as failed when matching throws', async () => {
    const prisma = createPrismaMock();
    prisma.dlContact.count.mockResolvedValue(1);
    prisma.dlContact.findMany.mockRejectedValue(new Error('boom'));
    prisma.dlMatchRun.update.mockResolvedValue({ id: 20n, status: 'FAILED' });

    const service = new TelegramDlMatchService(
      prisma as never,
      {} as never,
      createQueueProducerMock() as never,
    );

    await expect(service.processRun('20')).rejects.toThrow('boom');
    expect(prisma.dlMatchRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 20n },
        data: expect.objectContaining({
          status: 'FAILED',
          error: 'boom',
        }),
      }),
    );
  });
});
