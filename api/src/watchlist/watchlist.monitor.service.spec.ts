import { vi, beforeEach, afterEach } from 'vitest';
import { WatchlistMonitorService } from './watchlist.monitor.service.js';
import type { WatchlistService } from './watchlist.service.js';

describe('WatchlistMonitorService', () => {
  let service: WatchlistMonitorService;
  let watchlistServiceMock: {
    refreshActiveAuthors: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();

    watchlistServiceMock = {
      refreshActiveAuthors: vi.fn().mockResolvedValue(undefined),
    };

    service = new WatchlistMonitorService(
      watchlistServiceMock as unknown as WatchlistService,
    );
  });

  afterEach(() => {
    service.onModuleDestroy();
    vi.useRealTimers();
  });

  describe('onModuleInit', () => {
    it('вызывает refreshActiveAuthors сразу при старте', async () => {
      service.onModuleInit();
      // Flush microtasks/promises without advancing the interval timer
      await vi.advanceTimersByTimeAsync(0);

      expect(watchlistServiceMock.refreshActiveAuthors).toHaveBeenCalledTimes(
        1,
      );
    });

    it('вызывает refreshActiveAuthors повторно по интервалу', async () => {
      service.onModuleInit();
      await vi.advanceTimersByTimeAsync(0);

      expect(watchlistServiceMock.refreshActiveAuthors).toHaveBeenCalledTimes(
        1,
      );

      await vi.advanceTimersByTimeAsync(60_000);

      expect(watchlistServiceMock.refreshActiveAuthors).toHaveBeenCalledTimes(
        2,
      );
    });

    it('вызывает refreshActiveAuthors трижды за 2 интервала', async () => {
      service.onModuleInit();
      await vi.advanceTimersByTimeAsync(0);

      await vi.advanceTimersByTimeAsync(60_000);
      await vi.advanceTimersByTimeAsync(60_000);

      // 1 (сразу) + 2 (по таймеру)
      expect(watchlistServiceMock.refreshActiveAuthors).toHaveBeenCalledTimes(
        3,
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('останавливает интервал и прекращает вызывать refreshActiveAuthors', async () => {
      service.onModuleInit();
      await vi.advanceTimersByTimeAsync(0);

      service.onModuleDestroy();
      await vi.advanceTimersByTimeAsync(60_000 * 5);

      // Только один вызов при старте; после destroy больше не вызывается
      expect(watchlistServiceMock.refreshActiveAuthors).toHaveBeenCalledTimes(
        1,
      );
    });

    it('не падает при повторном вызове onModuleDestroy', () => {
      service.onModuleInit();
      expect(() => {
        service.onModuleDestroy();
        service.onModuleDestroy();
      }).not.toThrow();
    });
  });

  describe('обработка ошибок', () => {
    it('перехватывает ошибку из refreshActiveAuthors и не прерывает работу', async () => {
      watchlistServiceMock.refreshActiveAuthors
        .mockRejectedValueOnce(new Error('VK API timeout'))
        .mockResolvedValueOnce(undefined);

      service.onModuleInit();
      await vi.advanceTimersByTimeAsync(0);

      // Первый вызов завершился с ошибкой — сервис не упал
      expect(watchlistServiceMock.refreshActiveAuthors).toHaveBeenCalledTimes(
        1,
      );

      // Следующий тик должен продолжить работу
      await vi.advanceTimersByTimeAsync(60_000);

      expect(watchlistServiceMock.refreshActiveAuthors).toHaveBeenCalledTimes(
        2,
      );
    });
  });
});
