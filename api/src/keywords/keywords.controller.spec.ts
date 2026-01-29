import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { KeywordsController } from './keywords.controller.js';
import { KeywordsService } from './keywords.service.js';
import { AddKeywordDto } from './dto/add-keyword.dto.js';
import { BulkAddKeywordsDto } from './dto/bulk-add-keywords.dto.js';

const mockKeywordsService = () => ({
  addKeyword: vi.fn(),
  bulkAddKeywords: vi.fn(),
  addKeywordsFromFile: vi.fn(),
  getKeywords: vi.fn(),
  deleteAllKeywords: vi.fn(),
  deleteKeyword: vi.fn(),
});

describe('KeywordsController', () => {
  let controller: KeywordsController;
  let keywordsService: ReturnType<typeof mockKeywordsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KeywordsController],
      providers: [
        {
          provide: KeywordsService,
          useFactory: () => mockKeywordsService(),
        },
      ],
    }).compile();

    controller = module.get<KeywordsController>(KeywordsController);
    keywordsService = module.get<KeywordsService>(
      KeywordsService,
    ) as unknown as ReturnType<typeof mockKeywordsService>;

    vi.clearAllMocks();
  });

  it('должен добавить ключевое слово через POST /add', async () => {
    const dto: AddKeywordDto = { word: 'test', category: 'Маркетинг' };
    const response = {
      id: 1,
      word: 'test',
      category: 'Маркетинг',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    keywordsService.addKeyword.mockResolvedValue(response);

    const result = await controller.addKeyword(dto);

    expect(result).toEqual(response);
    expect(keywordsService.addKeyword).toHaveBeenCalledWith(
      'test',
      'Маркетинг',
      undefined,
    );
  });

  it('должен массово добавить ключевые слова через POST /bulk-add', async () => {
    const dto: BulkAddKeywordsDto = { words: ['one', 'two'] };
    const response = {
      success: [],
      failed: [],
      total: 2,
      successCount: 0,
      failedCount: 0,
      createdCount: 0,
      updatedCount: 0,
    };
    keywordsService.bulkAddKeywords.mockResolvedValue(response);

    const result = await controller.bulkAddKeywords(dto);

    expect(result).toEqual(response);
    expect(keywordsService.bulkAddKeywords).toHaveBeenCalledWith([
      'one',
      'two',
    ]);
  });

  it('должен загрузить ключевые слова из файла через POST /upload', async () => {
    const fileContent = 'one\ntwo';
    const file = {
      buffer: Buffer.from(fileContent, 'utf-8'),
    } as Express.Multer.File;
    const response = {
      success: [],
      failed: [],
      total: 2,
      successCount: 0,
      failedCount: 0,
      createdCount: 0,
      updatedCount: 0,
    };
    keywordsService.addKeywordsFromFile.mockResolvedValue(response);

    const result = await controller.uploadKeywords(file);

    expect(result).toEqual(response);
    expect(keywordsService.addKeywordsFromFile).toHaveBeenCalledWith(
      fileContent,
    );
  });

  it('должен выбросить ошибку, если файл не передан в POST /upload', async () => {
    await expect(
      controller.uploadKeywords(undefined as unknown as Express.Multer.File),
    ).rejects.toThrow(BadRequestException);
    expect(keywordsService.addKeywordsFromFile).not.toHaveBeenCalled();
  });

  it('должен вернуть все ключевые слова через GET /', async () => {
    const response = {
      keywords: [
        {
          id: 1,
          word: 'one',
          category: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          word: 'two',
          category: 'Продажи',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 2,
      page: 1,
      limit: 50,
    };
    keywordsService.getKeywords.mockResolvedValue(response);

    const result = await controller.getAllKeywords({});

    expect(result).toEqual(response);
    expect(keywordsService.getKeywords).toHaveBeenCalledWith({
      page: 1,
      limit: 50,
    });
  });

  it('должен удалить все ключевые слова через DELETE /all', async () => {
    const response = { count: 2 };
    keywordsService.deleteAllKeywords.mockResolvedValue(response);

    const result = await controller.deleteAllKeywords();

    expect(result).toEqual(response);
    expect(keywordsService.deleteAllKeywords).toHaveBeenCalled();
  });

  it('должен удалить ключевое слово по id через DELETE /:id', async () => {
    const response = {
      success: true,
      id: 1,
    };
    keywordsService.deleteKeyword.mockResolvedValue(response);

    const result = await controller.deleteKeyword({ id: 1 });

    expect(result).toEqual(response);
    expect(keywordsService.deleteKeyword).toHaveBeenCalledWith(1);
  });
});
