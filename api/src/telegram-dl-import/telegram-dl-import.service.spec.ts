import { Logger } from '@nestjs/common';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Express } from 'express';
import { TelegramDlImportService } from './telegram-dl-import.service.js';

const createPrismaMock = () => ({
  $transaction: vi.fn(),
  dlImportBatch: {
    create: vi.fn(),
    update: vi.fn(),
  },
  dlImportFile: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  dlContact: {
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
});

const createParserMock = () => ({
  parse: vi.fn(),
});

const createXlsxFile = (name: string): Express.Multer.File =>
  ({
    originalname: name,
    mimetype:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 128,
    buffer: Buffer.from('xlsx'),
  }) as Express.Multer.File;

describe('TelegramDlImportService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let parser: ReturnType<typeof createParserMock>;
  let loggerErrorSpy: ReturnType<typeof vi.spyOn>;
  let loggerWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    prisma = createPrismaMock();
    parser = createParserMock();
    loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    loggerWarnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
    loggerWarnSpy.mockRestore();
  });

  it('imports several files into one batch', async () => {
    parser.parse
      .mockReturnValueOnce({
        originalFileName: 'groupexport_a.xlsx',
        replacementKey: 'groupexport_a.xlsx',
        sheetName: 'Sheet1',
        rowsTotal: 1,
        contacts: [
          {
            telegramId: '1',
            phone: '79990000001',
            date: '2024-01-01T00:00:00.000Z',
            sourceRowIndex: 2,
          },
        ],
      })
      .mockReturnValueOnce({
        originalFileName: 'groupexport_b.xlsx',
        replacementKey: 'groupexport_b.xlsx',
        sheetName: 'Sheet1',
        rowsTotal: 1,
        contacts: [
          {
            telegramId: '2',
            phone: '79990000002',
            date: '2024-01-02T00:00:00.000Z',
            sourceRowIndex: 2,
          },
        ],
      });

    prisma.dlImportBatch.create.mockResolvedValue({
      id: 10,
      status: 'RUNNING',
      filesTotal: 2,
      filesSuccess: 0,
      filesFailed: 0,
    });
    prisma.dlImportBatch.update.mockResolvedValue({
      id: 10,
      status: 'DONE',
      filesTotal: 2,
      filesSuccess: 2,
      filesFailed: 0,
    });
    prisma.dlImportFile.create
      .mockResolvedValueOnce({
        id: 101,
        originalFileName: 'groupexport_a.xlsx',
      })
      .mockResolvedValueOnce({
        id: 102,
        originalFileName: 'groupexport_b.xlsx',
      });
    prisma.dlImportFile.findFirst.mockResolvedValue(null);
    prisma.dlImportFile.update
      .mockResolvedValueOnce({
        id: 101,
        originalFileName: 'groupexport_a.xlsx',
        status: 'DONE',
        rowsTotal: 1,
        rowsSuccess: 1,
        rowsFailed: 0,
        isActive: true,
        replacedFileId: null,
        error: null,
      })
      .mockResolvedValueOnce({
        id: 102,
        originalFileName: 'groupexport_b.xlsx',
        status: 'DONE',
        rowsTotal: 1,
        rowsSuccess: 1,
        rowsFailed: 0,
        isActive: true,
        replacedFileId: null,
        error: null,
      });
    prisma.dlContact.createMany.mockResolvedValue({ count: 1 });
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof prisma) => unknown) => callback(prisma),
    );

    const service = new TelegramDlImportService(
      prisma as never,
      parser as never,
    );

    const result = await service.uploadFiles([
      createXlsxFile('groupexport_a.xlsx'),
      createXlsxFile('groupexport_b.xlsx'),
    ]);

    expect(result.batch.filesTotal).toBe(2);
    expect(result.files).toHaveLength(2);
    expect(prisma.dlImportBatch.create).toHaveBeenCalledTimes(1);
    expect(prisma.dlImportFile.create).toHaveBeenCalledTimes(2);
  });

  it('skips duplicate file when active version with the same name already exists', async () => {
    prisma.dlImportBatch.create.mockResolvedValue({
      id: 10,
      status: 'RUNNING',
      filesTotal: 1,
      filesSuccess: 0,
      filesFailed: 0,
    });
    prisma.dlImportBatch.update.mockResolvedValue({
      id: 10,
      status: 'DONE',
      filesTotal: 1,
      filesSuccess: 1,
      filesFailed: 0,
    });
    prisma.dlImportFile.create.mockResolvedValue({
      id: 101,
      originalFileName: 'groupexport_same.xlsx',
      status: 'SKIPPED',
      rowsTotal: 0,
      rowsSuccess: 0,
      rowsFailed: 0,
      isActive: false,
      replacedFileId: null,
      error: 'Файл уже загружен, повторная выгрузка пропущена',
    });
    prisma.dlImportFile.findFirst.mockResolvedValueOnce({
      id: 77,
      originalFileName: 'groupexport_same.xlsx',
      isActive: true,
      status: 'DONE',
    });

    const service = new TelegramDlImportService(
      prisma as never,
      parser as never,
    );

    const result = await service.uploadFiles([
      createXlsxFile('groupexport_same.xlsx'),
    ]);

    expect(result.files[0].status).toBe('SKIPPED');
    expect(parser.parse).not.toHaveBeenCalled();
    expect(prisma.dlImportFile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          originalFileName: 'groupexport_same.xlsx',
          isActive: true,
          status: 'DONE',
        },
      }),
    );
    expect(prisma.dlContact.createMany).not.toHaveBeenCalled();
    expect(prisma.dlImportFile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          originalFileName: 'groupexport_same.xlsx',
          status: 'SKIPPED',
        }),
      }),
    );
  });

  it('allows retry when there is no active successful duplicate', async () => {
    parser.parse.mockReturnValue({
      originalFileName: 'groupexport_same.xlsx',
      replacementKey: 'groupexport_same.xlsx',
      sheetName: 'Sheet1',
      rowsTotal: 1,
      contacts: [
        {
          telegramId: '1',
          phone: '79990000001',
          date: '2024-01-01T00:00:00.000Z',
          sourceRowIndex: 2,
        },
      ],
    });

    prisma.dlImportBatch.create.mockResolvedValue({
      id: 10,
      status: 'RUNNING',
      filesTotal: 1,
      filesSuccess: 0,
      filesFailed: 0,
    });
    prisma.dlImportBatch.update.mockResolvedValue({
      id: 10,
      status: 'PARTIAL',
      filesTotal: 1,
      filesSuccess: 0,
      filesFailed: 1,
    });
    prisma.dlImportFile.create.mockResolvedValue({
      id: 101,
      originalFileName: 'groupexport_same.xlsx',
    });
    prisma.dlImportFile.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prisma.dlContact.createMany.mockRejectedValue(new Error('db failed'));
    prisma.dlImportFile.update.mockResolvedValue({
      id: 101,
      originalFileName: 'groupexport_same.xlsx',
      status: 'FAILED',
      rowsTotal: 1,
      rowsSuccess: 0,
      rowsFailed: 1,
      isActive: false,
      replacedFileId: null,
      error: 'db failed',
    });

    const service = new TelegramDlImportService(
      prisma as never,
      parser as never,
    );

    const result = await service.uploadFiles([
      createXlsxFile('groupexport_same.xlsx'),
    ]);

    expect(parser.parse).toHaveBeenCalledTimes(1);
    expect(result.files[0].status).toBe('FAILED');
    expect(prisma.dlImportFile.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 77 },
        data: expect.objectContaining({ isActive: false }),
      }),
    );
  });

  it('logs longest parsed field lengths when contact insert fails', async () => {
    parser.parse.mockReturnValue({
      originalFileName: 'groupexport_long.xlsx',
      replacementKey: 'groupexport_long.xlsx',
      sheetName: 'Sheet1',
      rowsTotal: 1,
      contacts: [
        {
          telegramId: '1',
          phone: '79990000001',
          username: 'short',
          channels: 'https://t.me/example/'.padEnd(400, 'a'),
          description: 'desc'.padEnd(300, 'b'),
          date: '2024-01-01T00:00:00.000Z',
          sourceRowIndex: 2,
        },
      ],
    });

    prisma.dlImportBatch.create.mockResolvedValue({
      id: 10,
      status: 'RUNNING',
      filesTotal: 1,
      filesSuccess: 0,
      filesFailed: 0,
    });
    prisma.dlImportBatch.update.mockResolvedValue({
      id: 10,
      status: 'PARTIAL',
      filesTotal: 1,
      filesSuccess: 0,
      filesFailed: 1,
    });
    prisma.dlImportFile.create.mockResolvedValue({
      id: 101,
      originalFileName: 'groupexport_long.xlsx',
    });
    prisma.dlImportFile.findFirst.mockResolvedValue(null);
    prisma.dlContact.createMany.mockRejectedValue(new Error('db failed'));
    prisma.dlImportFile.update.mockResolvedValue({
      id: 101,
      originalFileName: 'groupexport_long.xlsx',
      status: 'FAILED',
      rowsTotal: 1,
      rowsSuccess: 0,
      rowsFailed: 1,
      isActive: false,
      replacedFileId: null,
      error: 'db failed',
    });

    const service = new TelegramDlImportService(
      prisma as never,
      parser as never,
    );

    await service.uploadFiles([createXlsxFile('groupexport_long.xlsx')]);

    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'длины полей dl_contact для groupexport_long.xlsx',
      ),
    );
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('channelsRaw:400'),
    );
  });

  it('returns full dl contact payload for frontend tables', async () => {
    prisma.dlContact.findMany.mockResolvedValue([
      {
        id: 101n,
        telegramId: '123',
        username: 'alpha',
        phone: '+79990000001',
        firstName: 'Alpha',
        lastName: 'One',
        description: 'desc',
        region: 'region',
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        channelsRaw: 'channels',
        fullName: 'Alpha One',
        address: 'address',
        vkUrl: 'vk',
        email: 'alpha@example.com',
        telegramContact: '@alpha',
        instagram: 'inst',
        viber: 'viber',
        odnoklassniki: 'ok',
        birthDateText: '1990-01-01',
        usernameExtra: 'alpha_extra',
        geo: 'geo',
        sourceRowIndex: 7,
        createdAt: new Date('2024-01-02T00:00:00.000Z'),
        importFile: {
          originalFileName: 'dl.xlsx',
          isActive: true,
        },
      },
    ]);

    const service = new TelegramDlImportService(
      prisma as never,
      parser as never,
    );

    await expect(service.getContacts({})).resolves.toEqual([
      expect.objectContaining({
        id: '101',
        originalFileName: 'dl.xlsx',
        telegramId: '123',
        username: 'alpha',
        phone: '+79990000001',
        firstName: 'Alpha',
        lastName: 'One',
        description: 'desc',
        region: 'region',
        joinedAt: '2024-01-01T00:00:00.000Z',
        channelsRaw: 'channels',
        fullName: 'Alpha One',
        address: 'address',
        vkUrl: 'vk',
        email: 'alpha@example.com',
        telegramContact: '@alpha',
        instagram: 'inst',
        viber: 'viber',
        odnoklassniki: 'ok',
        birthDateText: '1990-01-01',
        usernameExtra: 'alpha_extra',
        geo: 'geo',
        sourceRowIndex: 7,
        createdAt: '2024-01-02T00:00:00.000Z',
        isActive: true,
      }),
    ]);
    expect(prisma.dlContact.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          importFile: true,
        },
      }),
    );
  });
});
