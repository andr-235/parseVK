import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WatchlistAuthorService } from './watchlist-author.service.js';
import { WatchlistStatus } from '../types/watchlist-status.enum.js';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

const makeAuthorRecord = (overrides = {}) => ({
  id: 1,
  authorVkId: 100,
  sourceCommentId: null,
  settingsId: 1,
  status: WatchlistStatus.ACTIVE,
  lastCheckedAt: null,
  lastActivityAt: null,
  foundCommentsCount: 0,
  monitoringStartedAt: new Date(),
  monitoringStoppedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  author: {
    id: 10,
    vkUserId: 100,
    firstName: 'Иван',
    lastName: 'Иванов',
    photo50: null,
    photo100: null,
    photo200Orig: null,
    screenName: null,
    domain: null,
  },
  settings: {
    id: 1,
    trackAllComments: true,
    pollIntervalMinutes: 5,
    maxAuthors: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  ...overrides,
});

describe('WatchlistAuthorService', () => {
  let service: WatchlistAuthorService;
  let repository: ReturnType<typeof makeRepositoryMock>;
  let authorMapper: ReturnType<typeof makeMapperMock>;
  let statsCollector: ReturnType<typeof makeStatsCollectorMock>;
  let authorRefresher: ReturnType<typeof makeRefresherMock>;
  let queryValidator: ReturnType<typeof makeValidatorMock>;
  let authorActivityService: ReturnType<typeof makeActivityServiceMock>;

  function makeRepositoryMock() {
    return {
      ensureSettings: vi.fn().mockResolvedValue({
        id: 1,
        pollIntervalMinutes: 5,
        maxAuthors: 50,
        trackAllComments: true,
      }),
      findMany: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      findById: vi.fn().mockResolvedValue(makeAuthorRecord()),
      findByAuthorVkIdAndSettingsId: vi.fn().mockResolvedValue(null),
      findCommentById: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(makeAuthorRecord()),
      update: vi.fn().mockResolvedValue(makeAuthorRecord()),
      updateMany: vi.fn().mockResolvedValue(undefined),
      updateComment: vi.fn().mockResolvedValue(undefined),
      countComments: vi.fn().mockResolvedValue(0),
      getAuthorComments: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      findActiveAuthors: vi.fn().mockResolvedValue([]),
    };
  }

  function makeMapperMock() {
    return {
      mapAuthor: vi.fn().mockReturnValue({ id: 1, authorVkId: 100 }),
      mapComment: vi.fn().mockReturnValue({ id: 1 }),
    };
  }

  function makeStatsCollectorMock() {
    return {
      collectCommentCounts: vi.fn().mockResolvedValue(new Map()),
      collectAnalysisSummaries: vi.fn().mockResolvedValue(new Map()),
      resolveSummary: vi.fn().mockReturnValue({
        total: 0,
        suspicious: 0,
        lastAnalyzedAt: null,
        categories: [],
        levels: [],
      }),
    };
  }

  function makeRefresherMock() {
    return {
      refreshAuthorRecord: vi.fn().mockResolvedValue(0),
    };
  }

  function makeValidatorMock() {
    return {
      normalizeOffset: vi.fn((v) => v ?? 0),
      normalizeLimit: vi.fn((v) => v ?? 20),
      normalizeExcludeStopped: vi.fn((v) => v ?? true),
    };
  }

  function makeActivityServiceMock() {
    return {
      saveAuthors: vi.fn().mockResolvedValue(undefined),
    };
  }

  beforeEach(() => {
    repository = makeRepositoryMock();
    authorMapper = makeMapperMock();
    statsCollector = makeStatsCollectorMock();
    authorRefresher = makeRefresherMock();
    queryValidator = makeValidatorMock();
    authorActivityService = makeActivityServiceMock();

    service = new WatchlistAuthorService(
      repository as never,
      authorMapper as never,
      statsCollector as never,
      authorRefresher as never,
      queryValidator as never,
      authorActivityService as never,
    );
  });

  describe('getAuthors', () => {
    it('возвращает список авторов', async () => {
      const record = makeAuthorRecord();
      repository.findMany.mockResolvedValue({ items: [record], total: 1 });
      statsCollector.collectCommentCounts.mockResolvedValue(new Map([[1, 5]]));

      const result = await service.getAuthors({ offset: 0, limit: 20 });

      expect(repository.findMany).toHaveBeenCalled();
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });

    it('вычисляет hasMore корректно', async () => {
      repository.findMany.mockResolvedValue({
        items: [makeAuthorRecord()],
        total: 5,
      });

      const result = await service.getAuthors({ offset: 0, limit: 1 });
      expect(result.hasMore).toBe(true);
    });
  });

  describe('getAuthorDetails', () => {
    it('выбрасывает NotFoundException если автор не найден', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.getAuthorDetails(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('возвращает детали автора с комментариями', async () => {
      repository.getAuthorComments.mockResolvedValue({ items: [], total: 0 });

      const result = await service.getAuthorDetails(1);
      expect(result).toBeDefined();
      expect(repository.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('createAuthor', () => {
    it('выбрасывает BadRequestException если нет ни commentId ни authorVkId', async () => {
      await expect(service.createAuthor({} as never)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('выбрасывает NotFoundException если commentId не найден', async () => {
      repository.findCommentById.mockResolvedValue(null);
      await expect(
        service.createAuthor({ commentId: 999 } as never),
      ).rejects.toThrow(NotFoundException);
    });

    it('выбрасывает ConflictException если автор уже добавлен', async () => {
      repository.findByAuthorVkIdAndSettingsId.mockResolvedValue(
        makeAuthorRecord(),
      );
      await expect(
        service.createAuthor({ authorVkId: 100 } as never),
      ).rejects.toThrow(ConflictException);
    });

    it('создаёт автора по authorVkId', async () => {
      const result = await service.createAuthor({ authorVkId: 200 } as never);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          authorVkId: 200,
          status: WatchlistStatus.ACTIVE,
        }),
      );
      expect(authorActivityService.saveAuthors).toHaveBeenCalledWith([200]);
      expect(result).toBeDefined();
    });
  });

  describe('updateAuthor', () => {
    it('выбрасывает NotFoundException если автор не найден', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.updateAuthor(999, {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('обновляет статус на STOPPED и устанавливает monitoringStoppedAt', async () => {
      repository.update.mockResolvedValue(
        makeAuthorRecord({ status: WatchlistStatus.STOPPED }),
      );

      await service.updateAuthor(1, { status: WatchlistStatus.STOPPED });

      expect(repository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: WatchlistStatus.STOPPED,
          monitoringStoppedAt: expect.any(Date),
        }),
      );
    });

    it('возвращает автора без изменений если DTO пустой', async () => {
      await service.updateAuthor(1, {});

      expect(repository.update).not.toHaveBeenCalled();
      expect(repository.countComments).toHaveBeenCalledWith(1);
    });
  });

  describe('refreshActiveAuthors', () => {
    it('пропускает обновление если interval ещё не истёк', async () => {
      // первый вызов запустит обновление
      repository.findActiveAuthors.mockResolvedValue([]);
      await service.refreshActiveAuthors();
      expect(repository.findActiveAuthors).toHaveBeenCalled();

      // второй вызов сразу после — должен быть пропущен из-за pollInterval
      repository.findActiveAuthors.mockClear();
      await service.refreshActiveAuthors();
      expect(repository.findActiveAuthors).not.toHaveBeenCalled();
    });

    it('не вызывает refreshAuthorRecord если нет активных авторов', async () => {
      // Force skip by resetting timestamp via re-creating service
      const freshService = new WatchlistAuthorService(
        repository as never,
        authorMapper as never,
        statsCollector as never,
        authorRefresher as never,
        queryValidator as never,
        authorActivityService as never,
      );
      repository.findActiveAuthors.mockResolvedValue([]);

      await freshService.refreshActiveAuthors();

      expect(authorRefresher.refreshAuthorRecord).not.toHaveBeenCalled();
    });
  });
});
