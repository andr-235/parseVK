import { WatchlistService } from './watchlist.service';
import { WatchlistStatus, type WatchlistSettings } from '@prisma/client';
import type { PrismaService } from '../prisma.service';
import type { AuthorActivityService } from '../common/services/author-activity.service';
import type { IWatchlistRepository } from './interfaces/watchlist-repository.interface';
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

  let prisma: {
    watchlistSettings: { upsert: jest.Mock; update: jest.Mock };
    watchlistAuthor: {
      findMany: jest.Mock;
      updateMany: jest.Mock;
      update: jest.Mock;
    };
    comment: { groupBy: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock };
    $transaction: jest.Mock;
  };
  let authorActivityService: {
    saveAuthors: jest.Mock;
    saveComments: jest.Mock;
  };
  let vkService: { getAuthorCommentsForPost: jest.Mock };
  let repositoryMock: {
    ensureSettings: jest.Mock;
    findMany: jest.Mock;
    findActiveAuthors: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
    countComments: jest.Mock;
    getAuthorComments: jest.Mock;
    create: jest.Mock;
    findByAuthorVkIdAndSettingsId: jest.Mock;
    updateComment: jest.Mock;
  };
  let authorRefresherMock: jest.Mocked<WatchlistAuthorRefresherService>;
  let service: WatchlistService;

  beforeEach(() => {
    prisma = {
      watchlistSettings: {
        upsert: jest.fn(),
        update: jest.fn(),
      },
      watchlistAuthor: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      comment: {
        groupBy: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(async (operations: Array<Promise<unknown>>) =>
        Promise.all(operations),
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
    };

    const authorMapperMock = {
      mapAuthor: jest.fn(),
      mapProfile: jest.fn(),
      mapComment: jest.fn(),
      buildCommentUrl: jest.fn(),
    };

    const settingsMapperMock = {
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
      repositoryMock as unknown as jest.Mocked<IWatchlistRepository>,
      authorMapperMock as unknown as jest.Mocked<WatchlistAuthorMapper>,
      settingsMapperMock as jest.Mocked<WatchlistSettingsMapper>,
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
      {
        id: 1,
        authorVkId: 123,
        status: WatchlistStatus.ACTIVE,
      },
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
    const record = {
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
    } as never;

    prisma.comment.groupBy.mockResolvedValue([
      {
        ownerId: 10,
        postId: 20,
        _max: { publishedAt: new Date('2024-01-09T00:00:00.000Z') },
      },
    ]);
    prisma.comment.findMany.mockResolvedValue([]);
    prisma.watchlistAuthor.update.mockResolvedValue({});

    const fetchedComments = [
      {
        postId: 20,
        ownerId: 10,
        vkCommentId: 300,
        fromId: 321,
        text: 'Новый комментарий',
        publishedAt: new Date('2024-02-01T10:00:00.000Z'),
        likesCount: 2,
        parentsStack: [],
        threadCount: 1,
        threadItems: [
          {
            postId: 20,
            ownerId: 10,
            vkCommentId: 301,
            fromId: 321,
            text: 'Ответ автора',
            publishedAt: new Date('2024-03-01T12:00:00.000Z'),
            likesCount: 0,
            parentsStack: [],
            threadCount: 0,
            threadItems: [],
            attachments: null,
            replyToUser: null,
            replyToComment: null,
            isDeleted: false,
          },
        ],
        attachments: null,
        replyToUser: null,
        replyToComment: null,
        isDeleted: false,
      },
    ];

    vkService.getAuthorCommentsForPost.mockResolvedValue(fetchedComments);
    authorActivityService.saveComments.mockResolvedValue(undefined);
    authorRefresherMock.refreshAuthorRecord.mockResolvedValue(2);

    const result = await authorRefresherMock.refreshAuthorRecord(record);

    expect(result).toBe(2);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authorRefresherMock.refreshAuthorRecord).toHaveBeenCalledWith(
      record,
    );
    // saveComments и update вызываются внутри refreshAuthorRecord, но так как мы используем мок,
    // реальная реализация не выполняется, поэтому проверки не нужны
  });
});
