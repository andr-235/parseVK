import { Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { TelegramDlMatchService } from './telegram-dl-match.service.js';

const createPrismaMock = () => ({
  $transaction: vi.fn((input: unknown) => {
    if (typeof input === 'function') {
      return input(createPrismaMock());
    }
    return input;
  }),
  dlContact: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  message: {
    findMany: vi.fn(),
  },
  channel: {
    findMany: vi.fn(),
  },
  supergroup: {
    findMany: vi.fn(),
  },
  group: {
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
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
  dlMatchResultChat: {
    createMany: vi.fn(),
    updateMany: vi.fn(),
    findMany: vi.fn(),
    groupBy: vi.fn(),
  },
  dlMatchResultMessage: {
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
    prisma.message.findMany
      .mockResolvedValueOnce([
        {
          from_id: 100n,
          peer_id: 9001n,
          message_id: 501n,
          date: new Date('2026-03-25T00:00:00.000Z'),
          message: 'Alpha in supergroup',
        },
        {
          from_id: 100n,
          peer_id: 9002n,
          message_id: 502n,
          date: new Date('2026-03-25T00:01:00.000Z'),
          message: 'Alpha in channel',
        },
      ])
      .mockResolvedValueOnce([
        {
          from_id: 200n,
          peer_id: 9003n,
          message_id: 503n,
          date: new Date('2026-03-25T00:02:00.000Z'),
          message: 'Beta in supergroup',
        },
      ]);
    prisma.channel.findMany
      .mockResolvedValueOnce([{ channel_id: 9002n, title: 'Channel Alpha' }])
      .mockResolvedValueOnce([]);
    prisma.supergroup.findMany
      .mockResolvedValueOnce([
        { supergroup_id: 9001n, title: 'Supergroup Alpha' },
      ])
      .mockResolvedValueOnce([
        { supergroup_id: 9003n, title: 'Supergroup Beta' },
      ]);
    prisma.group.findMany.mockResolvedValue([]);
    prisma.dlMatchResult.create.mockResolvedValue({
      id: 1000n,
      runId: 10n,
      dlContactId: 1n,
      tgmbaseUserId: 100n,
    });
    prisma.dlMatchResultChat.createMany.mockResolvedValue({ count: 2 });
    prisma.dlMatchResultMessage.createMany.mockResolvedValue({ count: 2 });
    prisma.$transaction = vi.fn((callback) => callback(prisma));

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
    expect(prisma.dlMatchResult.create).toHaveBeenCalledTimes(2);
    expect(prisma.dlMatchResult.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          chatActivityMatch: true,
          tgmbaseUserSnapshot: expect.objectContaining({
            relatedChats: [
              {
                type: 'supergroup',
                peer_id: '9001',
                title: 'Supergroup Alpha',
              },
              {
                type: 'channel',
                peer_id: '9002',
                title: 'Channel Alpha',
              },
            ],
          }),
        }),
      }),
    );
    expect(prisma.dlMatchResultChat.createMany).toHaveBeenCalled();
    expect(prisma.dlMatchResultMessage.createMany).toHaveBeenCalled();
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
        chatActivityMatch: true,
        dlContactSnapshot: {
          telegramId: '123',
          username: 'alpha',
        },
        tgmbaseUserSnapshot: {
          user_id: '123',
          username: 'alpha',
          relatedChats: [
            {
              type: 'supergroup',
              peer_id: '9001',
              title: 'Supergroup Alpha',
            },
          ],
        },
        createdAt: new Date('2026-03-25T00:00:00.000Z'),
        chats: [
          {
            peerId: '9001',
            chatType: 'supergroup',
            title: 'Supergroup Alpha',
            isExcluded: false,
          },
        ],
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
    await expect(service.getResults('1')).resolves.toEqual([
      expect.objectContaining({
        chatActivityMatch: true,
        user: expect.objectContaining({
          relatedChats: [
            {
              type: 'supergroup',
              peer_id: '9001',
              title: 'Supergroup Alpha',
            },
          ],
        }),
      }),
    ]);
  });

  it('hides strict matches when all related chats are excluded', async () => {
    const prisma = createPrismaMock();
    prisma.dlMatchResult.findMany.mockResolvedValue([
      {
        id: 11n,
        runId: 1n,
        dlContactId: 21n,
        tgmbaseUserId: 31n,
        strictTelegramIdMatch: true,
        usernameMatch: false,
        phoneMatch: false,
        chatActivityMatch: false,
        dlContactSnapshot: {
          telegramId: '123',
        },
        tgmbaseUserSnapshot: {
          user_id: '123',
          username: 'alpha',
          relatedChats: [
            {
              type: 'supergroup',
              peer_id: '-1001424415743',
              title: 'Рожа фашизма',
            },
          ],
        },
        createdAt: new Date('2026-03-25T00:00:00.000Z'),
        chats: [],
        _count: {
          chats: 1,
        },
      },
      {
        id: 12n,
        runId: 1n,
        dlContactId: 22n,
        tgmbaseUserId: 32n,
        strictTelegramIdMatch: true,
        usernameMatch: false,
        phoneMatch: false,
        chatActivityMatch: false,
        dlContactSnapshot: {
          telegramId: '456',
        },
        tgmbaseUserSnapshot: {
          user_id: '456',
          username: 'beta',
        },
        createdAt: new Date('2026-03-25T00:00:01.000Z'),
        chats: [],
        _count: {
          chats: 0,
        },
      },
    ]);

    const service = new TelegramDlMatchService(
      prisma as never,
      {} as never,
      createQueueProducerMock() as never,
    );

    await expect(service.getResults('1')).resolves.toEqual([
      expect.objectContaining({
        id: '12',
        strictTelegramIdMatch: true,
      }),
    ]);
  });

  it('excludes peer ids and hides results with no signals left', async () => {
    const prisma = createPrismaMock();
    prisma.dlMatchResultChat.findMany.mockResolvedValue([
      { resultId: 11n },
      { resultId: 12n },
    ]);
    prisma.$transaction = vi.fn((callback) => callback(prisma));
    prisma.dlMatchResultChat.updateMany.mockResolvedValue({ count: 1 });
    prisma.dlMatchResultChat.groupBy.mockResolvedValue([{ resultId: 11n }]);
    prisma.dlMatchResult.updateMany.mockResolvedValue({ count: 2 });
    prisma.dlMatchResult.findMany.mockResolvedValue([
      {
        strictTelegramIdMatch: true,
        usernameMatch: false,
        phoneMatch: false,
      },
    ]);
    prisma.dlMatchRun.findUnique.mockResolvedValue({
      id: 1n,
      status: 'DONE',
      contactsTotal: 10,
      matchesTotal: 4,
      strictMatchesTotal: 1,
      usernameMatchesTotal: 1,
      phoneMatchesTotal: 0,
      createdAt: new Date('2026-03-25T00:00:00.000Z'),
      finishedAt: new Date('2026-03-25T00:10:00.000Z'),
      error: null,
    });

    const service = new TelegramDlMatchService(
      prisma as never,
      {} as never,
      createQueueProducerMock() as never,
    );

    await service.excludeChat('1', '9001');

    expect(prisma.dlMatchResultChat.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          peerId: '9001',
        }),
        data: { isExcluded: true },
      }),
    );
    expect(prisma.dlMatchResult.updateMany).toHaveBeenCalled();
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
