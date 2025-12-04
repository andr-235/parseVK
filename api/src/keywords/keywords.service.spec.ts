import { KeywordsService } from './keywords.service';
import type { IKeywordsRepository } from './interfaces/keywords-repository.interface';
import { KeywordsMatchesService } from './services/keywords-matches.service';
import type { IBulkAddResponse } from './interfaces/keyword.interface';

describe('KeywordsService', () => {
  let service: KeywordsService;
  let repositoryMock: jest.Mocked<IKeywordsRepository>;
  let matchesServiceMock: jest.Mocked<KeywordsMatchesService>;

  beforeEach(() => {
    repositoryMock = {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findManyWithSelect: jest.fn(),
      count: jest.fn(),
      countComments: jest.fn(),
      countPosts: jest.fn(),
      findCommentsBatch: jest.fn(),
      findPostsBatch: jest.fn(),
      findCommentsByPost: jest.fn(),
      findCommentKeywordMatches: jest.fn(),
      findPostKeywordMatches: jest.fn(),
      deleteCommentKeywordMatches: jest.fn(),
      deletePostKeywordMatches: jest.fn(),
      createCommentKeywordMatches: jest.fn(),
    } as jest.Mocked<IKeywordsRepository>;

    matchesServiceMock = {
      repository: repositoryMock,
      recalculateKeywordMatches: jest.fn(),
    } as unknown as jest.Mocked<KeywordsMatchesService>;

    service = new KeywordsService(repositoryMock, matchesServiceMock);
    jest.clearAllMocks();
    repositoryMock.findMany.mockResolvedValue([]);
  });

  it('должен нормализовать регистр при добавлении ключевого слова', async () => {
    const keyword = {
      id: 1,
      word: 'test',
      category: null,
      isPhrase: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repositoryMock.findUnique.mockResolvedValue(null);
    repositoryMock.create.mockResolvedValue(keyword);

    const result = await service.addKeyword('  TeSt  ');

    expect(repositoryMock['findUnique']).toHaveBeenCalledWith({ word: 'test' });
    expect(repositoryMock['create']).toHaveBeenCalledWith({
      word: 'test',
      category: null,
      isPhrase: false,
    });
    expect(result).toEqual(keyword);
  });

  it('должен сохранять категорию при добавлении ключевого слова', async () => {
    const existing = {
      id: 1,
      word: 'test',
      category: null,
      isPhrase: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updated = {
      ...existing,
      category: 'Маркетинг',
    };
    repositoryMock.findUnique.mockResolvedValue(existing);
    repositoryMock.update.mockResolvedValue(updated);

    const result = await service.addKeyword('test', '  Маркетинг  ');

    expect(repositoryMock['findUnique']).toHaveBeenCalledWith({ word: 'test' });
    expect(repositoryMock['update']).toHaveBeenCalledWith(
      { id: 1 },
      { category: 'Маркетинг', isPhrase: false },
    );
    expect(result).toEqual(updated);
  });

  it('должен возвращать статистику успешного добавления в bulkAddKeywords', async () => {
    const keyword = {
      id: 1,
      word: 'one',
      category: null,
      isPhrase: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const addKeywordSpy = jest
      .spyOn(service, 'addKeyword')
      .mockResolvedValue(keyword);

    const result = await service.bulkAddKeywords(['one']);

    expect(addKeywordSpy).toHaveBeenCalledWith('one', undefined);
    expect(result).toEqual({
      success: [keyword],
      failed: [],
      stats: {
        total: 1,
        success: 1,
        failed: 0,
        created: 1,
        updated: 0,
      },
    });
  });

  it('должен собирать ошибки при исключениях в bulkAddKeywords', async () => {
    const error = new Error('duplicate');
    jest.spyOn(service, 'addKeyword').mockRejectedValueOnce(error);

    const result = await service.bulkAddKeywords(['one']);

    expect(result.success).toEqual([]);
    expect(result.failed).toEqual([{ word: 'one', error: 'duplicate' }]);
    expect(result.stats.total).toBe(1);
    expect(result.stats.success).toBe(0);
    expect(result.stats.failed).toBe(1);
    expect(result.stats.created).toBe(0);
    expect(result.stats.updated).toBe(0);
  });

  it('должен обновлять существующие ключевые слова при повторном добавлении', async () => {
    const existingKeyword = {
      id: 1,
      word: 'one',
      category: null,
      isPhrase: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updatedKeyword = { ...existingKeyword, category: 'Маркетинг' };

    repositoryMock.findMany.mockResolvedValue([existingKeyword]);
    jest.spyOn(service, 'addKeyword').mockResolvedValue(updatedKeyword);

    const result = await (
      service as unknown as {
        bulkAddKeywordEntries: (
          entries: { word: string; category?: string }[],
        ) => Promise<IBulkAddResponse>;
      }
    ).bulkAddKeywordEntries([{ word: 'one', category: 'Маркетинг' }]);

    expect(result).toEqual({
      success: [updatedKeyword],
      failed: [],
      stats: {
        total: 1,
        success: 1,
        failed: 0,
        created: 0,
        updated: 1,
      },
    });
  });

  it('должен разбирать текстовый файл и сохранять категории из него', async () => {
    const fileContent = 'first\ncategory; second\nthird; marketing\n';
    const bulkSpy = jest
      .spyOn(
        service as unknown as {
          bulkAddKeywordEntries: (
            entries: unknown[],
          ) => Promise<IBulkAddResponse>;
        },
        'bulkAddKeywordEntries',
      )
      .mockResolvedValue({
        success: [],
        failed: [],
        stats: {
          total: 0,
          success: 0,
          failed: 0,
          created: 0,
          updated: 0,
        },
      });

    await service.addKeywordsFromFile(fileContent);

    expect(bulkSpy).toHaveBeenCalledWith([
      { word: 'first' },
      { word: 'category', category: 'second' },
      { word: 'third', category: 'marketing' },
    ]);
  });

  it('должен удалять ключевое слово с корректными аргументами', async () => {
    repositoryMock.delete.mockResolvedValue(undefined);

    const result = await service.deleteKeyword(1);

    expect(repositoryMock['delete']).toHaveBeenCalledWith({ id: 1 });
    expect(result).toEqual({ success: true, id: 1 });
  });

  it('должен удалять все ключевые слова с корректными аргументами', async () => {
    const response = { count: 2 };
    repositoryMock.deleteMany.mockResolvedValue(response);

    const result = await service.deleteAllKeywords();

    expect(repositoryMock['deleteMany']).toHaveBeenCalled();
    expect(result).toEqual({ success: true, count: 2 });
  });
});
