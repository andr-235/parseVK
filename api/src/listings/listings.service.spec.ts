import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListingsService } from './listings.service.js';
import type { IListingsRepository } from './interfaces/listings-repository.interface.js';

const makeRepository = (): IListingsRepository => ({
  getListingsWithCountAndSources: vi.fn().mockResolvedValue({
    listings: [],
    total: 0,
    distinctSources: [],
  }),
  findMany: vi.fn().mockResolvedValue([]),
  count: vi.fn().mockResolvedValue(0),
  findUniqueOrThrow: vi.fn(),
  findUniqueByUrl: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  transaction: vi.fn(),
});

describe('ListingsService', () => {
  let service: ListingsService;
  let repository: ReturnType<typeof makeRepository>;

  beforeEach(() => {
    repository = makeRepository();
    service = new ListingsService(repository);
  });

  describe('getListings — сортировка', () => {
    it('при sortBy=sourceAuthorName передаёт contactSort=asc и не передаёт orderBy', async () => {
      await service.getListings({
        page: 1,
        pageSize: 20,
        sortBy: 'sourceAuthorName',
        sortOrder: 'asc',
      });

      const call = (
        repository.getListingsWithCountAndSources as ReturnType<typeof vi.fn>
      ).mock.calls[0][0] as { orderBy?: unknown; contactSort?: string };

      expect(call.contactSort).toBe('asc');
      expect(call.orderBy).toBeUndefined();
    });

    it('при sortBy=sourceAuthorName desc передаёт contactSort=desc', async () => {
      await service.getListings({
        page: 1,
        pageSize: 20,
        sortBy: 'sourceAuthorName',
        sortOrder: 'desc',
      });

      const call = (
        repository.getListingsWithCountAndSources as ReturnType<typeof vi.fn>
      ).mock.calls[0][0] as { orderBy?: unknown; contactSort?: string };

      expect(call.contactSort).toBe('desc');
      expect(call.orderBy).toBeUndefined();
    });

    it('при sortBy=price использует одиночный ключ (не составной)', async () => {
      await service.getListings({
        page: 1,
        pageSize: 20,
        sortBy: 'price',
        sortOrder: 'asc',
      });

      const call = (
        repository.getListingsWithCountAndSources as ReturnType<typeof vi.fn>
      ).mock.calls[0][0] as { orderBy: unknown };

      expect(call.orderBy).toEqual([{ price: 'asc' }]);
    });

    it('при sortBy=undefined использует сортировку по умолчанию (createdAt desc)', async () => {
      await service.getListings({
        page: 1,
        pageSize: 20,
      });

      const call = (
        repository.getListingsWithCountAndSources as ReturnType<typeof vi.fn>
      ).mock.calls[0][0] as { orderBy: unknown };

      expect(call.orderBy).toEqual([{ createdAt: 'desc' }]);
    });
  });
});
