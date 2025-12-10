import { WatchlistService } from './watchlist.service';
import { WatchlistStatus, type WatchlistSettings } from '@prisma/client';
import type { PrismaService } from '../prisma.service';
import type { AuthorActivityService } from '../common/services/author-activity.service';
import type {
  IWatchlistRepository,
  WatchlistAuthorWithRelations,
} from './interfaces/watchlist-repository.interface';
import type { WatchlistAuthorMapper } from './mappers/watchlist-author.mapper';
import type { WatchlistSettingsMapper } from './mappers/watchlist-settings.mapper';
import type { WatchlistStatsCollectorService } from './services/watchlist-stats-collector.service';
import type { WatchlistAuthorRefresherService } from './services/watchlist-author-refresher.service';
import type { WatchlistQueryValidator } from './validators/watchlist-query.validator';

jest.mock('vk-io', () => {
  class APIErrorMock extends Error {}

  return {
    VK: jest.fn().mockImplementation(() => ({ api: {} })),
    APIError: APIErrorMock,
  };
});

jest.mock('@prisma/client', () => {
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
    overrides: Partial<WatchlistSettings> = {},
  ): WatchlistSettings => ({
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
      upsert: jest.Mock<Promise<WatchlistSettings>>;
      update: jest.Mock<Promise<WatchlistSettings>>;
    };
    watchlistAuthor: {
      findMany: jest.Mock<Promise<unknown[]>>;
      updateMany: jest.Mock<Promise<{ count: number }>>;
      update: jest.Mock<Promise<unknown>>;
    };
    comment: {
      groupBy: jest.Mock<Promise<unknown[]>>;
      findMany: jest.Mock<Promise<unknown[]>>;
      findUnique: jest.Mock<Promise<unknown>>;
    };
    $transaction: jest.Mock<Promise<unknown[]>>;
  };
  let authorActivityService: {
    saveAuthors: jest.Mock;
    saveComments: jest.Mock;
  };
  let vkService: { getAuthorCommentsForPost: jest.Mock };
  let repositoryMock: jest.Mocked<IWatchlistRepository>;
  let authorRefresherMock: jest.Mocked<WatchlistAuthorRefresherService>;
  let service: WatchlistService;

  beforeEach(() => {
    prisma = {
      watchlistSettings: {
        upsert: jest.fn<Promise<WatchlistSettings>, [unknown]>(),
        update: jest.fn<Promise<WatchlistSettings>, [unknown, unknown]>(),
      },
      watchlistAuthor: {
        findMany: jest.fn<Promise<unknown[]>, [unknown?]>(),
        updateMany: jest.fn<Promise<{ count: number }>, [unknown]>(),
        update: jest.fn<Promise<unknown>, [unknown, unknown]>(),
      },
      comment: {
        groupBy: jest.fn<Promise<unknown[]>, [unknown]>(),
        findMany: jest.fn<Promise<unknown[]>, [unknown?]>(),
        findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      },
      $transaction: jest.fn<Promise<unknown[]>, [Array<Promise<unknown>>]>(
        async (operations: Array<Promise<unknown>>) => Promise.all(operations),
      ),
    };

    authorActivityService = {
      saveAuthors: jest.fn(),
      saveComments: jest.fn(),
    };

    vkService = {
      getAuthorCommentsForPost: jest.fn(),
    };

    repositoryMock = {
      ensureSettings: jest.fn().mockResolvedValue(createSettings()),
      findMany: jest.fn(),
      findActiveAuthors: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      countComments: jest.fn(),
      getAuthorComments: jest.fn(),
      create: jest.fn(),
      findByAuthorVkIdAndSettingsId: jest.fn(),
      updateComment: jest.fn(),
      getTrackedPosts: jest.fn(),
      loadExistingCommentKeys: jest.fn(),
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
      findCommentById: jest.fn(),
    };

    const authorMapperMock: jest.Mocked<WatchlistAuthorMapper> = {
      mapAuthor: jest.fn(),
      mapProfile: jest.fn(),
      mapComment: jest.fn(),
      buildCommentUrl: jest.fn(),
    };

    const settingsMapperMock: jest.Mocked<WatchlistSettingsMapper> = {
      map: jest.fn(),
    };

    const statsCollectorMock = {
      collectCommentCounts: jest.fn().mockResolvedValue(new Map()),
      collectAnalysisSummaries: jest.fn().mockResolvedValue(new Map()),
      resolveSummary: jest.fn(),
      prisma: {} as unknown as PrismaService,
      photoAnalysisService: {} as unknown as never,
      cloneSummary: jest.fn(),
    } as unknown as jest.Mocked<WatchlistStatsCollectorService>;

    authorRefresherMock = {
      refreshAuthorRecord: jest.fn(),
      logger: {} as unknown as never,
      repository: {} as unknown as IWatchlistRepository,
      prisma: {} as unknown as PrismaService,
      authorActivityService: {} as unknown as AuthorActivityService,
      vkService: {} as unknown as never,
    } as unknown as jest.Mocked<WatchlistAuthorRefresherService>;

    const queryValidatorMock: jest.Mocked<WatchlistQueryValidator> = {
      normalizeOffset: jest.fn((v?: number): number => v ?? 0),
      normalizeLimit: jest.fn((v?: number): number => v ?? 20),
      normalizeExcludeStopped: jest.fn((v?: boolean): boolean => v !== false),
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
    jest.restoreAllMocks();
  });

  it('не повторяет обновление авторов чаще заданного интервала', async () => {
    repositoryMock.findActiveAuthors.mockResolvedValue([]);

    const dateSpy = jest.spyOn(Date, 'now');
    dateSpy.mockReturnValue(1_000_000);

    await service.refreshActiveAuthors();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repositoryMock.findActiveAuthors).toHaveBeenCalledTimes(1);

    repositoryMock.findActiveAuthors.mockClear();
    dateSpy.mockReturnValue(1_000_100);

    await service.refreshActiveAuthors();

    // eslint-disable-next-line @typescript-eslint/unbound-method
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
    // eslint-disable-next-line @typescript-eslint/unbound-method
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

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repositoryMock.findActiveAuthors).toHaveBeenCalledWith({
      settingsId: 1,
      limit: 10,
    });
    expect(authorActivityService.saveAuthors).toHaveBeenCalledWith([321]);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authorRefresherMock.refreshAuthorRecord).toHaveBeenCalledWith(
      record,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authorRefresherMock.refreshAuthorRecord).toHaveBeenCalledTimes(1);
  });
});
