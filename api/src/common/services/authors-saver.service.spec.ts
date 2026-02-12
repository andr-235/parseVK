import { vi } from 'vitest';
import { AuthorsSaverService } from './authors-saver.service.js';
import type { PrismaService } from '../../prisma.service.js';
import type { VkService } from '../../vk/vk.service.js';
import type { IAuthor } from '../../vk/interfaces/author.interfaces.js';

const makeAuthor = (id: number, overrides: Partial<IAuthor> = {}): IAuthor => ({
  id,
  first_name: 'Иван',
  last_name: 'Иванов',
  ...overrides,
});

describe('AuthorsSaverService', () => {
  let service: AuthorsSaverService;
  let prismaMock: {
    author: {
      findMany: ReturnType<typeof vi.fn>;
      upsert: ReturnType<typeof vi.fn>;
    };
  };
  let vkServiceMock: {
    getAuthors: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prismaMock = {
      author: {
        findMany: vi.fn().mockResolvedValue([]),
        upsert: vi.fn().mockResolvedValue({ id: 1 }),
      },
    };
    vkServiceMock = {
      getAuthors: vi.fn().mockResolvedValue([]),
    };

    service = new AuthorsSaverService(
      prismaMock as unknown as PrismaService,
      vkServiceMock as unknown as VkService,
    );
  });

  describe('saveAuthors', () => {
    it('возвращает 0 если массив пустой', async () => {
      const result = await service.saveAuthors([]);
      expect(result).toBe(0);
      expect(vkServiceMock.getAuthors).not.toHaveBeenCalled();
    });

    it('фильтрует id <= 0 и возвращает 0', async () => {
      const result = await service.saveAuthors([0, -1, -5]);
      expect(result).toBe(0);
      expect(vkServiceMock.getAuthors).not.toHaveBeenCalled();
    });

    it('дедуплицирует id перед запросом в VK API', async () => {
      vkServiceMock.getAuthors.mockResolvedValue([makeAuthor(1)]);
      await service.saveAuthors([1, 1, 1]);
      expect(vkServiceMock.getAuthors).toHaveBeenCalledWith([1]);
    });

    it('делает upsert для каждого автора из VK API', async () => {
      const authors = [makeAuthor(1), makeAuthor(2)];
      vkServiceMock.getAuthors.mockResolvedValue(authors);

      const result = await service.saveAuthors([1, 2]);

      expect(result).toBe(2);
      expect(prismaMock.author.upsert).toHaveBeenCalledTimes(2);
      expect(prismaMock.author.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { vkUserId: 1 },
        }),
      );
    });

    it('возвращает 0 если VK API вернул пустой массив', async () => {
      vkServiceMock.getAuthors.mockResolvedValue([]);
      const result = await service.saveAuthors([1, 2, 3]);
      expect(result).toBe(0);
    });
  });

  describe('refreshAllAuthors', () => {
    it('возвращает 0 если авторов в БД нет', async () => {
      prismaMock.author.findMany.mockResolvedValue([]);
      const result = await service.refreshAllAuthors();
      expect(result).toBe(0);
      expect(vkServiceMock.getAuthors).not.toHaveBeenCalled();
    });

    it('обновляет авторов пачками по batchSize', async () => {
      const authors = [{ vkUserId: 1 }, { vkUserId: 2 }, { vkUserId: 3 }];
      prismaMock.author.findMany.mockResolvedValue(authors);
      vkServiceMock.getAuthors
        .mockResolvedValueOnce([makeAuthor(1), makeAuthor(2)])
        .mockResolvedValueOnce([makeAuthor(3)]);

      const result = await service.refreshAllAuthors(2);

      expect(result).toBe(3);
      expect(vkServiceMock.getAuthors).toHaveBeenCalledTimes(2);
      expect(vkServiceMock.getAuthors).toHaveBeenNthCalledWith(1, [1, 2]);
      expect(vkServiceMock.getAuthors).toHaveBeenNthCalledWith(2, [3]);
    });

    it('обновляет всех авторов одной пачкой если batchSize >= количества авторов', async () => {
      const authors = [{ vkUserId: 10 }, { vkUserId: 20 }];
      prismaMock.author.findMany.mockResolvedValue(authors);
      vkServiceMock.getAuthors.mockResolvedValue([
        makeAuthor(10),
        makeAuthor(20),
      ]);

      const result = await service.refreshAllAuthors(500);

      expect(vkServiceMock.getAuthors).toHaveBeenCalledTimes(1);
      expect(result).toBe(2);
    });
  });
});
