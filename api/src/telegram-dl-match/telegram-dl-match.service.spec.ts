import { describe, expect, it, vi } from 'vitest';
import { TelegramDlMatchService } from './telegram-dl-match.service.js';

const createPrismaMock = () => ({
  $transaction: vi.fn(),
  dlContact: {
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

describe('TelegramDlMatchService', () => {
  it('creates strict, username and phone matches and persists aggregates', async () => {
    const prisma = createPrismaMock();
    prisma.dlContact.findMany.mockResolvedValue([
      {
        id: 1n,
        telegramId: '123',
        username: 'alpha',
        phone: '+79990000001',
        firstName: 'Alpha',
        lastName: 'One',
        fullName: 'Alpha One',
        region: 'Moscow',
        importFile: { originalFileName: 'dl.xlsx' },
      },
    ]);
    prisma.user.findMany.mockResolvedValue([
      {
        user_id: 123n,
        bot: false,
        scam: false,
        premium: true,
        first_name: 'Alpha',
        last_name: 'One',
        username: 'alpha',
        phone: '+79990000001',
        upd_date: new Date('2026-03-25T00:00:00.000Z'),
      },
    ]);
    prisma.dlMatchRun.create.mockResolvedValue({ id: 10n, status: 'RUNNING' });
    prisma.dlMatchRun.update.mockResolvedValue({ id: 10n, status: 'DONE' });
    prisma.dlMatchResult.createMany.mockResolvedValue({ count: 1 });
    prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) =>
      callback(prisma),
    );

    const service = new TelegramDlMatchService(prisma as never);
    const run = await service.createRun();

    expect(run.status).toBe('DONE');
    expect(run.contactsTotal).toBe(1);
    expect(run.matchesTotal).toBe(1);
    expect(run.strictMatchesTotal).toBe(1);
    expect(prisma.dlMatchResult.createMany).toHaveBeenCalledTimes(1);
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

    const service = new TelegramDlMatchService(prisma as never);

    await expect(service.getRuns()).resolves.toHaveLength(1);
    await expect(service.getRunById('1')).resolves.toMatchObject({
      id: '1',
      status: 'DONE',
    });
    await expect(service.getResults('1')).resolves.toHaveLength(1);
  });

  it('marks run as failed when matching throws', async () => {
    const prisma = createPrismaMock();
    prisma.dlContact.findMany.mockRejectedValue(new Error('boom'));
    prisma.dlMatchRun.create.mockResolvedValue({ id: 20n, status: 'RUNNING' });
    prisma.dlMatchRun.update.mockResolvedValue({ id: 20n, status: 'FAILED' });

    const service = new TelegramDlMatchService(prisma as never);

    await expect(service.createRun()).rejects.toThrow('boom');
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
