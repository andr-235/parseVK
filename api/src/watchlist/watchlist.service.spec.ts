import { vi } from 'vitest';
import { WatchlistService } from './watchlist.service.js';
import { WatchlistStatus } from './types/watchlist-status.enum.js';
import type { AuthorActivityService } from '../common/services/author-activity.service.js';
import type {
  IWatchlistRepository,
  WatchlistSettingsRecord,
  WatchlistAuthorWithRelations,
} from './interfaces/watchlist-repository.interface.js';
import type { WatchlistAuthorMapper } from './mappers/watchlist-author.mapper.js';
import type { WatchlistSettingsMapper } from './mappers/watchlist-settings.mapper.js';
import type { WatchlistStatsCollectorService } from './services/watchlist-stats-collector.service.js';
import type { WatchlistAuthorRefresherService } from './services/watchlist-author-refresher.service.js';
import type { WatchlistQueryValidator } from './validators/watchlist-query.validator.js';

vi.mock('vk-io', () => {
  class APIErrorMock extends Error {}

  return {
    VK: vi.fn().mockImplementation(() => ({ api: {} })),
    APIError: APIErrorMock,
  };
});

vi.mock('@/generated/prisma/client', () => {
  class PrismaClientMock {
    constructor() {}
  }

  return {
    Prisma: {},
    PrismaClient: PrismaClientMock,
    WatchlistStatus: { ACTIVE: 'ACTIVE', STOPPED: 'STOPPED' },
    CommentSource: { WATCHLIST: 'WATCHLIST' },
  };
});

describe('WatchlistService', () => {
  const createSettings = (
    overrides: Partial<WatchlistSettingsRecord> = {},
  ): WatchlistSettingsRecord => ({
    id: 1,
    trackAllComments: true,
    pollIntervalMinutes: 5,
    maxAuthors: 10,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  });
  const createAuthor = (
    overrides: Partial<WatchlistAuthorWithRelations> = {},
  ): WatchlistAuthorWithRelations => ({
    id: 1,
    authorVkId: 1,
    sourceCommentId: null,
    settingsId: 1,
    status: WatchlistStatus.ACTIVE,
    lastCheckedAt: null,
    lastActivityAt: null,
    foundCommentsCount: 0,
    monitoringStartedAt: new Date('2024-01-01T00:00:00.000Z'),
    monitoringStoppedAt: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    author: {
      id: 1,
      vkUserId: 1,
      firstName: null,
      lastName: null,
      photo50: null,
      photo100: null,
      photo200Orig: null,
      screenName: null,
      domain: null,
    },
    settings: createSettings(),
    ...overrides,
  });

  let prisma: {
    watchlistSettings: {
      upsert: vi.Mock<Promise<WatchlistSettingsRecord>>;
      update: vi.Mock<Promise<WatchlistSettingsRecord>>;
    };
    watchlistAuthor: {
      findMany: vi.Mock<Promise<unknown[]>>;
      updateMany: vi.Mock<Promise<{ count: number }>>;
      update: vi.Mock<Promise<unknown>>;
    };
    comment: {
      groupBy: vi.Mock<Promise<unknown[]>>;
      findMany: vi.Mock<Promise<unknown[]>>;
      findUnique: vi.Mock<Promise<unknown>>;
    };
    $transaction: vi.Mock<Promise<unknown[]>>;
  };
  let authorActivityService: {
    saveAuthors: vi.Mock;
    saveComments: vi.Mock;
  };
  let vkService: { getAuthorCommentsForPost: vi.Mock };
  let repositoryMock: vi.Mocked<IWatchlistRepository>;
  let authorRefresherMock: vi.Mocked<WatchlistAuthorRefresherService>;
  let service: WatchlistService;

  beforeEach(() => {
    prisma = {
      watchlistSettings: {
        upsert: vi.fn<Promise<WatchlistSettingsRecord>, [unknown]>(),
        update: vi.fn<Promise<WatchlistSettingsRecord>, [unknown, unknown]>(),
      },
      watchlistAuthor: {
        findMany: vi.fn<Promise<unknown[]>, [unknown?]>(),
        updateMany: vi.fn<Promise<{ count: number }>, [unknown]>(),
        update: vi.fn<Promise<unknown>, [unknown, unknown]>(),
      },
      comment: {
        groupBy: vi.fn<Promise<unknown[]>, [unknown]>(),
        findMany: vi.fn<Promise<unknown[]>, [unknown?]>(),
        findUnique: vi.fn<Promise<unknown>, [unknown]>(),
      },
      $transaction: vi.fn<Promise<unknown[]>, [Array<Promise<unknown>>]>(
        async (operations: Array<Promise<unknown>>) => Promise.all(operations),
      ),
    };

    authorActivityService = {
      saveAuthors: vi.fn(),
      saveComments: vi.fn(),
    };

    vkService = {
      getAuthorCommentsForPost: vi.fn(),
    };

    repositoryMock = {
      ensureSettings: vi.fn().mockResolvedValue(createSettings()),
      findMany: vi.fn(),
      findActiveAuthors: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      countComments: vi.fn(),
      getAuthorComments: vi.fn(),
      create: vi.fn(),
      findByAuthorVkIdAndSettingsId: vi.fn(),
      updateComment: vi.fn(),
      getTrackedPosts: vi.fn(),
      loadExistingCommentKeys: vi.fn(),
      getSettings: vi.fn(),
      updateSettings: vi.fn(),
      findCommentById: vi.fn(),
    };

    const authorMapperMock: vi.Mocked<WatchlistAuthorMapper> = {
      mapAuthor: vi.fn(),
      mapProfile: vi.fn(),
      mapComment: vi.fn(),
      buildCommentUrl: vi.fn(),
    };

    const settingsMapperMock: vi.Mocked<WatchlistSettingsMapper> = {
      map: vi.fn(),
    };

    const statsCollectorMock = {
      collectCommentCounts: vi.fn().mockResolvedValue(new Map()),
      collectAnalysisSummaries: vi.fn().mockResolvedValue(new Map()),
      resolveSummary: vi.fn(),
      photoAnalysisService: {} as unknown as never,
      cloneSummary: vi.fn(),
    } as unknown as vi.Mocked<WatchlistStatsCollectorService>;

    authorRefresherMock = {
      refreshAuthorRecord: vi.fn(),
      logger: {} as unknown as never,
      repository: {} as unknown as IWatchlistRepository,
      authorActivityService: {} as unknown as AuthorActivityService,
      vkService: {} as unknown as never,
    } as unknown as vi.Mocked<WatchlistAuthorRefresherService>;

    const queryValidatorMock: vi.Mocked<WatchlistQueryValidator> = {
      normalizeOffset: vi.fn((v?: number): number => v ?? 0),
      normalizeLimit: vi.fn((v?: number): number => v ?? 20),
      normalizeExcludeStopped: vi.fn((v?: boolean): boolean => v !== false),
    };

    service = new WatchlistService(
      repositoryMock,
      authorMapperMock,
      settingsMapperMock,
      statsCollectorMock,
      authorRefresherMock,
      queryValidatorMock,
      authorActivityService as unknown as AuthorActivityService,
    );

    prisma.watchlistSettings.upsert.mockResolvedValue(createSettings());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('не повторяет обновление авторов чаще заданного интервала', async () => {
    repositoryMock.findActiveAuthors.mockResolvedValue([]);

    const dateSpy = vi.spyOn(Date, 'now');
    dateSpy.mockReturnValue(1_000_000);

    await service.refreshActiveAuthors();

    expect(repositoryMock.findActiveAuthors).toHaveBeenCalledTimes(1);

    repositoryMock.findActiveAuthors.mockClear();
    dateSpy.mockReturnValue(1_000_100);

    await service.refreshActiveAuthors();

    expect(repositoryMock.findActiveAuthors).not.toHaveBeenCalled();
  });

  it('обновляет только отметки проверки, когда отключено отслеживание всех комментариев', async () => {
    repositoryMock.ensureSettings.mockResolvedValue(
      createSettings({ trackAllComments: false, pollIntervalMinutes: 1 }),
    );
    const authors = [
      createAuthor({ id: 1, authorVkId: 123, status: WatchlistStatus.ACTIVE }),
    ];

    repositoryMock.findActiveAuthors.mockResolvedValue(authors);
    repositoryMock.updateMany.mockResolvedValue(undefined);

    await service.refreshActiveAuthors();

    expect(authorActivityService.saveAuthors).toHaveBeenCalledWith([123]);

    expect(repositoryMock.updateMany).toHaveBeenCalledWith([1], {
      lastCheckedAt: expect.any(Date) as Date,
    });

    expect(vkService.getAuthorCommentsForPost).not.toHaveBeenCalled();
  });

  it('сохраняет новые комментарии автора и обновляет статистику записи', async () => {
    const record: WatchlistAuthorWithRelations = {
      id: 1,
      authorVkId: 321,
      status: WatchlistStatus.ACTIVE,
      settingsId: 1,
      lastActivityAt: new Date('2024-01-10T00:00:00.000Z'),
      lastCheckedAt: null,
      monitoringStartedAt: new Date('2024-01-01T00:00:00.000Z'),
      monitoringStoppedAt: null,
      foundCommentsCount: 0,
      sourceCommentId: null,
      author: null,
      settings: createSettings(),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    };

    repositoryMock.findActiveAuthors.mockResolvedValue([record]);
    authorRefresherMock.refreshAuthorRecord.mockResolvedValue(2);

    await service.refreshActiveAuthors();

    expect(repositoryMock.findActiveAuthors).toHaveBeenCalledWith({
      settingsId: 1,
      limit: 10,
    });
    expect(authorActivityService.saveAuthors).toHaveBeenCalledWith([321]);

    expect(authorRefresherMock.refreshAuthorRecord).toHaveBeenCalledWith(
      record,
    );

    expect(authorRefresherMock.refreshAuthorRecord).toHaveBeenCalledTimes(1);
  });
});
