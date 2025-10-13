import { KeywordsService } from './keywords.service';
import { PrismaService } from '../prisma.service';
import type { IBulkAddResponse } from './interfaces/keyword.interface';

describe('KeywordsService', () => {
  let service: KeywordsService;
  const prismaMock = {
    keyword: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(() => {
    service = new KeywordsService(prismaMock);
    jest.clearAllMocks();
    (prismaMock.keyword.findMany as jest.Mock).mockResolvedValue([]);
  });

  it('должен нормализовать регистр при добавлении ключевого слова', async () => {
    const keyword = {
      id: 1,
      word: 'test',
      category: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prismaMock.keyword.upsert as jest.Mock).mockResolvedValue(keyword);

    const result = await service.addKeyword('  TeSt  ');

    expect(prismaMock.keyword.upsert).toHaveBeenCalledWith({
      where: { word: 'test' },
      update: {},
      create: { word: 'test', category: null },
    });
    expect(result).toEqual(keyword);
  });

  it('должен сохранять категорию при добавлении ключевого слова', async () => {
    const keyword = {
      id: 1,
      word: 'test',
      category: 'Маркетинг',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prismaMock.keyword.upsert as jest.Mock).mockResolvedValue(keyword);

    const result = await service.addKeyword('test', '  Маркетинг  ');

    expect(prismaMock.keyword.upsert).toHaveBeenCalledWith({
      where: { word: 'test' },
      update: { category: 'Маркетинг' },
      create: { word: 'test', category: 'Маркетинг' },
    });
    expect(result).toEqual(keyword);
  });

  it('должен возвращать статистику успешного добавления в bulkAddKeywords', async () => {
    const keyword = {
      id: 1,
      word: 'one',
      category: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const addKeywordSpy = jest.spyOn(service, 'addKeyword').mockResolvedValue(keyword);

    const result = await service.bulkAddKeywords(['one']);

    expect(addKeywordSpy).toHaveBeenCalledWith('one', undefined);
    expect(result).toEqual({
      success: [keyword],
      failed: [],
      total: 1,
      successCount: 1,
      failedCount: 0,
      createdCount: 1,
      updatedCount: 0,
    });
  });

  it('должен собирать ошибки при исключениях в bulkAddKeywords', async () => {
    const error = new Error('duplicate');
    jest.spyOn(service, 'addKeyword').mockRejectedValueOnce(error);

    const result = await service.bulkAddKeywords(['one']);

    expect(result.success).toEqual([]);
    expect(result.failed).toEqual([{ word: 'one', error: 'duplicate' }]);
    expect(result.total).toBe(1);
    expect(result.successCount).toBe(0);
    expect(result.failedCount).toBe(1);
    expect(result.createdCount).toBe(0);
    expect(result.updatedCount).toBe(0);
  });

  it('должен обновлять существующие ключевые слова при повторном добавлении', async () => {
    const existingKeyword = {
      id: 1,
      word: 'one',
      category: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updatedKeyword = { ...existingKeyword, category: 'Маркетинг' };

    (prismaMock.keyword.findMany as jest.Mock).mockResolvedValue([existingKeyword]);
    jest.spyOn(service, 'addKeyword').mockResolvedValue(updatedKeyword);

    const result = await (service as unknown as { bulkAddKeywordEntries: (entries: { word: string; category?: string }[]) => Promise<IBulkAddResponse> }).bulkAddKeywordEntries([
      { word: 'one', category: 'Маркетинг' },
    ]);

    expect(result).toEqual({
      success: [updatedKeyword],
      failed: [],
      total: 1,
      successCount: 1,
      failedCount: 0,
      createdCount: 0,
      updatedCount: 1,
    });
  });

  it('должен разбирать текстовый файл и сохранять категории из него', async () => {
    const fileContent = 'first\ncategory; second\nthird, marketing\n';
    const bulkSpy = jest
      .spyOn(service as unknown as { bulkAddKeywordEntries: (entries: unknown[]) => Promise<IBulkAddResponse> }, 'bulkAddKeywordEntries')
      .mockResolvedValue({ success: [], failed: [], total: 0, successCount: 0, failedCount: 0, createdCount: 0, updatedCount: 0 });

    await service.addKeywordsFromFile(fileContent);

    expect(bulkSpy).toHaveBeenCalledWith([
      { word: 'first' },
      { word: 'category', category: 'second' },
      { word: 'third', category: 'marketing' },
    ]);
  });

  it('должен удалять ключевое слово с корректными аргументами', async () => {
    const keyword = {
      id: 1,
      word: 'one',
      category: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prismaMock.keyword.delete as jest.Mock).mockResolvedValue(keyword);

    const result = await service.deleteKeyword(1);

    expect(prismaMock.keyword.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual(keyword);
  });

  it('должен удалять все ключевые слова с корректными аргументами', async () => {
    const response = { count: 2 };
    (prismaMock.keyword.deleteMany as jest.Mock).mockResolvedValue(response);

    const result = await service.deleteAllKeywords();

    expect(prismaMock.keyword.deleteMany).toHaveBeenCalledWith({});
    expect(result).toEqual(response);
  });
});
