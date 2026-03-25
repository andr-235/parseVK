import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import type { Express } from 'express';
import { TelegramDlImportController } from './telegram-dl-import.controller.js';
import { TelegramDlImportService } from './telegram-dl-import.service.js';

const createXlsxFile = (name: string): Express.Multer.File =>
  ({
    originalname: name,
    mimetype:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 128,
    buffer: Buffer.from('xlsx'),
  }) as Express.Multer.File;

describe('TelegramDlImportController', () => {
  let controller: TelegramDlImportController;
  let service: {
    uploadFiles: vi.Mock;
    getFiles: vi.Mock;
    getContacts: vi.Mock;
  };

  beforeEach(async () => {
    service = {
      uploadFiles: vi.fn(),
      getFiles: vi.fn(),
      getContacts: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelegramDlImportController],
      providers: [
        {
          provide: TelegramDlImportService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<TelegramDlImportController>(
      TelegramDlImportController,
    );
  });

  it('uploads several xlsx files', async () => {
    service.uploadFiles.mockResolvedValue({ batch: { id: 1 }, files: [] });

    await expect(
      controller.uploadFiles([
        createXlsxFile('groupexport_a.xlsx'),
        createXlsxFile('groupexport_b.xlsx'),
      ]),
    ).resolves.toEqual({ batch: { id: 1 }, files: [] });

    expect(service.uploadFiles).toHaveBeenCalledWith([
      expect.objectContaining({ originalname: 'groupexport_a.xlsx' }),
      expect.objectContaining({ originalname: 'groupexport_b.xlsx' }),
    ]);
  });

  it('throws when no files are passed', async () => {
    await expect(controller.uploadFiles([])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns imported files history', async () => {
    service.getFiles.mockResolvedValue([
      { id: 1, originalFileName: 'test.xlsx' },
    ]);

    await expect(controller.getFiles({ activeOnly: true })).resolves.toEqual([
      { id: 1, originalFileName: 'test.xlsx' },
    ]);
    expect(service.getFiles).toHaveBeenCalledWith({ activeOnly: true });
  });

  it('returns imported contacts list', async () => {
    service.getContacts.mockResolvedValue({
      items: [{ id: 1, originalFileName: 'test.xlsx' }],
      total: 1,
      limit: 100,
      offset: 0,
    });

    await expect(
      controller.getContacts({ fileName: 'test.xlsx', limit: 100, offset: 0 }),
    ).resolves.toEqual({
      items: [{ id: 1, originalFileName: 'test.xlsx' }],
      total: 1,
      limit: 100,
      offset: 0,
    });
    expect(service.getContacts).toHaveBeenCalledWith({
      fileName: 'test.xlsx',
      limit: 100,
      offset: 0,
    });
  });
});
