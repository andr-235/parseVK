import { WatchlistService } from './watchlist.service';
import {
  WatchlistStatus,
  CommentSource,
  type WatchlistSettings,
} from '@prisma/client';
import type { PrismaService } from '../prisma.service';
import type { AuthorActivityService } from '../common/services/author-activity.service';
import type { VkService } from '../vk/vk.service';

jest.mock('vk-io', () => {
  class APIErrorMock extends Error {}

  return {
    VK: jest.fn().mockImplementation(() => ({ api: {} })),
    APIError: APIErrorMock,
  };
});

jest.mock('@prisma/client', () => {
  class PrismaClientMock {
    constructor(..._args: unknown[]) {}
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

    const repositoryMock = {
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
    };

    const authorRefresherMock = {
      refreshAuthorRecord: jest.fn(),
    };

    const queryValidatorMock = {
      normalizeOffset: jest.fn((v) => v ?? 0),
      normalizeLimit: jest.fn((v) => v ?? 20),
      normalizeExcludeStopped: jest.fn((v) => v !== false),
    };

    service = new WatchlistService(
      repositoryMock as any,
      authorMapperMock as any,
      settingsMapperMock as any,
      statsCollectorMock as any,
      authorRefresherMock as any,
      queryValidatorMock as any,
      authorActivityService as unknown as AuthorActivityService,
      prisma as unknown as PrismaService,
    );

    prisma.watchlistSettings.upsert.mockResolvedValue(createSettings());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('не повторяет обновление авторов чаще заданного интервала', async () => {
    prisma.watchlistAuthor.findMany.mockResolvedValue([]);

    const dateSpy = jest.spyOn(Date, 'now');
    dateSpy.mockReturnValue(1_000_000);

    await service.refreshActiveAuthors();

    expect(prisma.watchlistAuthor.findMany).toHaveBeenCalledTimes(1);

    prisma.watchlistAuthor.findMany.mockClear();
    dateSpy.mockReturnValue(1_000_100);

    await service.refreshActiveAuthors();

    expect(prisma.watchlistAuthor.findMany).not.toHaveBeenCalled();
  });

  it('обновляет только отметки проверки, когда отключено отслеживание всех комментариев', async () => {
    prisma.watchlistSettings.upsert.mockResolvedValue(
      createSettings({ trackAllComments: false, pollIntervalMinutes: 1 }),
    );
    const authors = [
      {
        id: 1,
        authorVkId: 123,
        status: WatchlistStatus.ACTIVE,
      },
    ];

    prisma.watchlistAuthor.findMany.mockResolvedValue(authors);
    prisma.watchlistAuthor.updateMany.mockResolvedValue({ count: 1 });

    await service.refreshActiveAuthors();

    expect(authorActivityService.saveAuthors).toHaveBeenCalledWith([123]);
    expect(prisma.watchlistAuthor.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [1] } },
      data: { lastCheckedAt: expect.any(Date) },
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

    const result = await (
      service as unknown as {
        refreshAuthorRecord: (value: typeof record) => Promise<number>;
      }
    ).refreshAuthorRecord(record);

    expect(result).toBe(2);
    expect(vkService.getAuthorCommentsForPost).toHaveBeenCalledWith({
      ownerId: 10,
      postId: 20,
      authorVkId: 321,
      baseline: new Date('2024-01-10T00:00:00.000Z'),
      batchSize: 100,
      maxPages: 5,
      threadItemsCount: 10,
    });
    expect(authorActivityService.saveComments).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          postId: 20,
          ownerId: 10,
          vkCommentId: 300,
          text: 'Новый комментарий',
          threadItems: [
            expect.objectContaining({
              vkCommentId: 301,
              text: 'Ответ автора',
            }),
          ],
        }),
      ],
      {
        source: CommentSource.WATCHLIST,
        watchlistAuthorId: 1,
      },
    );
    expect(prisma.watchlistAuthor.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({
        lastCheckedAt: expect.any(Date),
        foundCommentsCount: { increment: 2 },
        lastActivityAt: new Date('2024-03-01T12:00:00.000Z'),
      }),
    });
  });
});
