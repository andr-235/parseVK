import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { KeywordsController } from './keywords.controller';
import { KeywordsService } from './keywords.service';

const mockKeywordsService = () => ({
  addKeyword: jest.fn(),
  bulkAddKeywords: jest.fn(),
  addKeywordsFromFile: jest.fn(),
  getAllKeywords: jest.fn(),
  deleteAllKeywords: jest.fn(),
  deleteKeyword: jest.fn(),
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

    jest.clearAllMocks();
  });

  it('должен добавить ключевое слово через POST /add', async () => {
    const dto = { word: 'test', category: 'Маркетинг' };
    const response = {
      id: 1,
      word: 'test',
      category: 'Маркетинг',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    keywordsService.addKeyword.mockResolvedValue(response);

    const result = await controller.addKeyword(dto as any);

    expect(result).toEqual(response);
    expect(keywordsService.addKeyword).toHaveBeenCalledWith(
      'test',
      'Маркетинг',
    );
  });

  it('должен массово добавить ключевые слова через POST /bulk-add', async () => {
    const dto = { words: ['one', 'two'] };
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

    const result = await controller.bulkAddKeywords(dto as any);

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
    const response = [
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
    ];
    keywordsService.getAllKeywords.mockResolvedValue(response);

    const result = await controller.getAllKeywords();

    expect(result).toEqual(response);
    expect(keywordsService.getAllKeywords).toHaveBeenCalled();
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
      id: 1,
      word: 'one',
      category: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    keywordsService.deleteKeyword.mockResolvedValue(response);

    const result = await controller.deleteKeyword('1');

    expect(result).toEqual(response);
    expect(keywordsService.deleteKeyword).toHaveBeenCalledWith(1);
  });
});
