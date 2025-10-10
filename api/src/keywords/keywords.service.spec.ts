import { KeywordsService } from './keywords.service';
import { PrismaService } from '../prisma.service';

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
  });

  it('должен нормализовать регистр при добавлении ключевого слова', async () => {
    const keyword = {
      id: 1,
      word: 'test',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prismaMock.keyword.upsert as jest.Mock).mockResolvedValue(keyword);

    const result = await service.addKeyword('  TeSt  ');

    expect(prismaMock.keyword.upsert).toHaveBeenCalledWith({
      where: { word: 'test' },
      update: {},
      create: { word: 'test' },
    });
    expect(result).toEqual(keyword);
  });

  it('должен возвращать статистику успешного добавления в bulkAddKeywords', async () => {
    const keyword = {
      id: 1,
      word: 'one',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const addKeywordSpy = jest.spyOn(service, 'addKeyword').mockResolvedValue(keyword);

    const result = await service.bulkAddKeywords(['one']);

    expect(addKeywordSpy).toHaveBeenCalledWith('one');
    expect(result).toEqual({
      success: [keyword],
      failed: [],
      total: 1,
      successCount: 1,
      failedCount: 0,
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
  });

  it('должен разбирать текстовый файл и передавать слова в bulkAddKeywords', async () => {
    const fileContent = 'one\n\n two \nthree\r\n';
    const response = {
      success: [],
      failed: [],
      total: 3,
      successCount: 0,
      failedCount: 0,
    };
    const bulkAddSpy = jest.spyOn(service, 'bulkAddKeywords').mockResolvedValue(response);

    const result = await service.addKeywordsFromFile(fileContent);

    expect(bulkAddSpy).toHaveBeenCalledWith(['one', 'two', 'three']);
    expect(result).toBe(response);
  });

  it('должен удалять ключевое слово с корректными аргументами', async () => {
    const keyword = {
      id: 1,
      word: 'one',
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
