import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TelegramDlMatchController } from './telegram-dl-match.controller.js';
import { TelegramDlMatchService } from './telegram-dl-match.service.js';

describe('TelegramDlMatchController', () => {
  let controller: TelegramDlMatchController;
  const service = {
    createRun: vi.fn(),
    getRuns: vi.fn(),
    getRunById: vi.fn(),
    getResults: vi.fn(),
    exportRun: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelegramDlMatchController],
      providers: [
        {
          provide: TelegramDlMatchService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get(TelegramDlMatchController);
    vi.clearAllMocks();
  });

  it('starts a match run', async () => {
    service.createRun.mockResolvedValue({ id: '1', status: 'RUNNING' });

    await expect(controller.createRun()).resolves.toEqual({
      id: '1',
      status: 'RUNNING',
    });
  });

  it('returns runs and results', async () => {
    service.getRuns.mockResolvedValue([{ id: '1', status: 'DONE' }]);
    service.getRunById.mockResolvedValue({ id: '1', status: 'DONE' });
    service.getResults.mockResolvedValue([{ id: '11' }]);

    await expect(controller.getRuns()).resolves.toEqual([
      { id: '1', status: 'DONE' },
    ]);
    await expect(controller.getRunById('1')).resolves.toEqual({
      id: '1',
      status: 'DONE',
    });
    await expect(controller.getResults('1')).resolves.toEqual([{ id: '11' }]);
  });

  it('exports xlsx results with download headers', async () => {
    service.exportRun.mockResolvedValue({
      buffer: Buffer.from('xlsx'),
      fileName: 'dl-match-run-1.xlsx',
    });
    const res = {
      setHeader: vi.fn(),
      send: vi.fn(),
    };

    await controller.exportRun('1', {}, res as never);

    expect(service.exportRun).toHaveBeenCalledWith('1', {});
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="dl-match-run-1.xlsx"',
    );
    expect(res.send).toHaveBeenCalledWith(Buffer.from('xlsx'));
  });
});
