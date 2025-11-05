import { CommentsService } from './comments.service';
import { PrismaService } from '../prisma.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: {
    comment: { findMany: jest.Mock; count: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      comment: {
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (operations: Array<Promise<unknown>>) =>
        Promise.all(operations),
      ),
    };

    service = new CommentsService(prisma as unknown as PrismaService);
  });

  it('должен маппить данные автора и выставлять author: null при отсутствии данных', async () => {
    const commentsFromPrisma = [
      {
        id: 1,
        text: 'Комментарий с автором',
        publishedAt: new Date('2024-01-01T00:00:00.000Z'),
        authorVkId: 100,
        watchlistAuthorId: 42,
        author: {
          vkUserId: 100,
          firstName: 'Иван',
          lastName: 'Иванов',
          photo50: null,
          photo100: 'https://example.com/photo100.jpg',
          photo200Orig: null,
        },
        isRead: true,
        commentKeywordMatches: [
          {
            keyword: { id: 7, word: 'alert', category: 'security' },
          },
        ],
      },
      {
        id: 2,
        text: 'Комментарий без автора',
        publishedAt: new Date('2024-01-02T00:00:00.000Z'),
        authorVkId: null,
        watchlistAuthorId: null,
        author: null,
        isRead: false,
        commentKeywordMatches: [],
      },
    ] as never;

    prisma.comment.findMany.mockResolvedValue(commentsFromPrisma);
    prisma.comment.count
      .mockResolvedValueOnce(commentsFromPrisma.length)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    const result = await service.getComments({ offset: 0, limit: 100 });

    expect(result).toEqual({
      items: [
        expect.objectContaining({
          id: 1,
          text: 'Комментарий с автором',
          publishedAt: new Date('2024-01-01T00:00:00.000Z'),
          authorVkId: 100,
          watchlistAuthorId: 42,
          author: {
            vkUserId: 100,
            firstName: 'Иван',
            lastName: 'Иванов',
            logo: 'https://example.com/photo100.jpg',
          },
          isWatchlisted: true,
          matchedKeywords: [
            { id: 7, word: 'alert', category: 'security' },
          ],
        }),
        expect.objectContaining({
          id: 2,
          text: 'Комментарий без автора',
          publishedAt: new Date('2024-01-02T00:00:00.000Z'),
          authorVkId: null,
          watchlistAuthorId: null,
          author: null,
          isWatchlisted: false,
          matchedKeywords: [],
        }),
      ],
      total: commentsFromPrisma.length,
      hasMore: false,
      readCount: 1,
      unreadCount: 1,
    });
  });

  it('должен запрашивать комментарии, отсортированные по publishedAt', async () => {
    prisma.comment.findMany.mockResolvedValue([]);
    prisma.comment.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    await service.getComments({ offset: 0, limit: 50 });

    expect(prisma.comment.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 50,
      orderBy: { publishedAt: 'desc' },
      include: {
        author: {
          select: {
            vkUserId: true,
            firstName: true,
            lastName: true,
            photo50: true,
            photo100: true,
            photo200Orig: true,
          },
        },
        commentKeywordMatches: {
          include: {
            keyword: {
              select: {
                id: true,
                word: true,
                category: true,
              },
            },
          },
        },
      },
    });
    expect(prisma.comment.count).toHaveBeenCalledWith({ where: {} });
  });

  it('должен корректно выставлять hasMore при неполной странице', async () => {
    prisma.comment.findMany.mockResolvedValue([
      {
        id: 1,
        author: null,
        watchlistAuthorId: null,
        commentKeywordMatches: [],
      } as never,
    ]);
    prisma.comment.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3);

    const result = await service.getComments({ offset: 0, limit: 1 });

    expect(result).toEqual({
      items: [
        {
          id: 1,
          author: null,
          watchlistAuthorId: null,
          isWatchlisted: false,
          matchedKeywords: [],
        },
      ],
      total: 5,
      hasMore: true,
      readCount: 2,
      unreadCount: 3,
    });
  });

  it('должен применять фильтр по ключевым словам и статусу чтения', async () => {
    prisma.comment.findMany.mockResolvedValue([
      {
        id: 10,
        author: null,
        watchlistAuthorId: null,
        text: 'demo keyword',
        commentKeywordMatches: [
          { keyword: { id: 5, word: 'keyword', category: null } },
        ],
      } as never,
    ]);
    prisma.comment.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);

    await service.getComments({
      offset: 0,
      limit: 10,
      keywords: ['keyword', 'sample'],
      readStatus: 'unread',
      search: 'demo',
    });

    expect(prisma.comment.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          {
            AND: [
              {
                commentKeywordMatches: {
                  some: {
                    keyword: {
                      word: {
                        in: ['keyword', 'sample'],
                      },
                    },
                  },
                },
              },
              {
                text: {
                  contains: 'demo',
                  mode: 'insensitive',
                },
              },
            ],
          },
          { isRead: false },
        ],
      },
      skip: 0,
      take: 10,
      orderBy: { publishedAt: 'desc' },
      include: {
        author: {
          select: {
            vkUserId: true,
            firstName: true,
            lastName: true,
            photo50: true,
            photo100: true,
            photo200Orig: true,
          },
        },
        commentKeywordMatches: {
          include: {
            keyword: {
              select: {
                id: true,
                word: true,
                category: true,
              },
            },
          },
        },
      },
    });

    expect(prisma.comment.count).toHaveBeenNthCalledWith(1, {
      where: {
        AND: [
          {
            AND: [
              {
                commentKeywordMatches: {
                  some: {
                    keyword: {
                      word: {
                        in: ['keyword', 'sample'],
                      },
                    },
                  },
                },
              },
              {
                text: {
                  contains: 'demo',
                  mode: 'insensitive',
                },
              },
            ],
          },
          { isRead: false },
        ],
      },
    });

    expect(prisma.comment.count).toHaveBeenNthCalledWith(2, {
      where: {
        AND: [
          {
            AND: [
              {
                commentKeywordMatches: {
                  some: {
                    keyword: {
                      word: {
                        in: ['keyword', 'sample'],
                      },
                    },
                  },
                },
              },
              {
                text: {
                  contains: 'demo',
                  mode: 'insensitive',
                },
              },
            ],
          },
          { isRead: true },
        ],
      },
    });

    expect(prisma.comment.count).toHaveBeenNthCalledWith(3, {
      where: {
        AND: [
          {
            AND: [
              {
                commentKeywordMatches: {
                  some: {
                    keyword: {
                      word: {
                        in: ['keyword', 'sample'],
                      },
                    },
                  },
                },
              },
              {
                text: {
                  contains: 'demo',
                  mode: 'insensitive',
                },
              },
            ],
          },
          { isRead: false },
        ],
      },
    });
  });

  it('должен обновлять статус прочтения комментария', async () => {
    const comment = {
      id: 1,
      text: 'Комментарий',
      publishedAt: new Date('2024-01-01T00:00:00.000Z'),
      authorVkId: 100,
      isRead: true,
      watchlistAuthorId: null,
      author: {
        vkUserId: 100,
        firstName: 'Иван',
        lastName: 'Иванов',
        photo50: null,
        photo100: 'https://example.com/photo100.jpg',
        photo200Orig: null,
      },
      commentKeywordMatches: [],
    } as never;

    prisma.comment.update.mockResolvedValue(comment);

    await expect(service.setReadStatus(1, true)).resolves.toEqual(
      expect.objectContaining({
        id: 1,
        text: 'Комментарий',
        authorVkId: 100,
        isRead: true,
        author: {
          vkUserId: 100,
          firstName: 'Иван',
          lastName: 'Иванов',
          logo: 'https://example.com/photo100.jpg',
        },
        isWatchlisted: false,
        matchedKeywords: [],
      }),
    );

    expect(prisma.comment.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { isRead: true },
      include: {
        author: {
          select: {
            vkUserId: true,
            firstName: true,
            lastName: true,
            photo50: true,
            photo100: true,
            photo200Orig: true,
          },
        },
        commentKeywordMatches: {
          include: {
            keyword: {
              select: {
                id: true,
                word: true,
                category: true,
              },
            },
          },
        },
      },
    });
  });
});
