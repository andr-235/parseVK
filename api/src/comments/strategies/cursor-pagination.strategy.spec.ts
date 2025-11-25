import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CursorPaginationStrategy } from './cursor-pagination.strategy';
import type { ICommentsRepository } from '../interfaces/comments-repository.interface';
import { CommentsFilterBuilder } from '../builders/comments-filter.builder';
import { CommentMapper } from '../mappers/comment.mapper';
import { CursorUtils } from '../dto/comments-cursor.dto';
import type { CommentWithRelations } from '../interfaces/comments-repository.interface';
import type { CommentWithAuthorDto } from '../dto/comment-with-author.dto';

describe('CursorPaginationStrategy', () => {
  let strategy: CursorPaginationStrategy;
  let repository: jest.Mocked<ICommentsRepository>;
  let filterBuilder: jest.Mocked<CommentsFilterBuilder>;
  let mapper: jest.Mocked<CommentMapper>;

  beforeEach(async () => {
    repository = {
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      transaction: jest.fn(),
    } as never;

    filterBuilder = {
      buildBaseWhere: jest.fn(),
      buildReadStatusWhere: jest.fn(),
      mergeWhere: jest.fn(),
    } as never;

    mapper = {
      map: jest.fn(),
      mapMany: jest.fn(),
    } as never;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CursorPaginationStrategy,
        {
          provide: 'ICommentsRepository',
          useValue: repository,
        },
        {
          provide: CommentsFilterBuilder,
          useValue: filterBuilder,
        },
        {
          provide: CommentMapper,
          useValue: mapper,
        },
      ],
    }).compile();

    strategy = module.get<CursorPaginationStrategy>(CursorPaginationStrategy);
  });

  it('должен возвращать пагинированный список без cursor', async () => {
    const comments: CommentWithRelations[] = [
      {
        id: 1,
        text: 'Comment 1',
        publishedAt: new Date('2024-01-01'),
        isRead: false,
        watchlistAuthorId: null,
        author: null,
        commentKeywordMatches: [],
      },
    ];

    const mappedComments: CommentWithAuthorDto[] = comments.map((c) => ({
      ...c,
      isWatchlisted: false,
      matchedKeywords: [],
    })) as CommentWithAuthorDto[];

    filterBuilder.buildBaseWhere.mockReturnValue({});
    filterBuilder.buildReadStatusWhere.mockReturnValue({});
    filterBuilder.mergeWhere.mockReturnValue({});

    repository.findMany.mockResolvedValue(comments);
    repository.transaction.mockResolvedValue([10, 5, 5]);
    mapper.mapMany.mockReturnValue(mappedComments);

    const result = await strategy.execute({}, { limit: 10 });

    expect(result).toEqual({
      items: mappedComments,
      nextCursor: null,
      hasMore: false,
      total: 10,
      readCount: 5,
      unreadCount: 5,
    });

    expect(repository.findMany).toHaveBeenCalledWith({
      where: {},
      take: 11,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    });
  });

  it('должен декодировать cursor и использовать его для пагинации', async () => {
    const publishedAt = new Date('2024-01-01');
    const id = 123;
    const cursor = CursorUtils.encode(publishedAt, id);

    const comments: CommentWithRelations[] = [
      {
        id: 124,
        text: 'Comment',
        publishedAt: new Date('2024-01-02'),
        isRead: false,
        watchlistAuthorId: null,
        author: null,
        commentKeywordMatches: [],
      },
    ];

    const mappedComments: CommentWithAuthorDto[] = comments.map((c) => ({
      ...c,
      isWatchlisted: false,
      matchedKeywords: [],
    })) as CommentWithAuthorDto[];

    filterBuilder.buildBaseWhere.mockReturnValue({});
    filterBuilder.buildReadStatusWhere.mockReturnValue({});
    filterBuilder.mergeWhere.mockReturnValue({
      OR: [
        { publishedAt: { lt: publishedAt } },
        { publishedAt, id: { lt: id } },
      ],
    });

    repository.findMany.mockResolvedValue(comments);
    repository.transaction.mockResolvedValue([10, 5, 5]);
    mapper.mapMany.mockReturnValue(mappedComments);

    const result = await strategy.execute({}, { cursor, limit: 10 });

    expect(result.items).toEqual(mappedComments);
    expect(filterBuilder.mergeWhere).toHaveBeenCalledWith(
      {},
      {},
      expect.objectContaining({
        OR: expect.any(Array),
      }),
    );
  });

  it('должен выбрасывать BadRequestException для невалидного cursor', async () => {
    await expect(
      strategy.execute({}, { cursor: 'invalid-cursor', limit: 10 }),
    ).rejects.toThrow(BadRequestException);

    expect(repository.findMany).not.toHaveBeenCalled();
  });

  it('должен генерировать nextCursor если hasMore = true', async () => {
    const comments: CommentWithRelations[] = Array.from({ length: 11 }, (_, i) => ({
      id: i + 1,
      text: `Comment ${i + 1}`,
      publishedAt: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
      isRead: false,
      watchlistAuthorId: null,
      author: null,
      commentKeywordMatches: [],
    }));

    const mappedComments: CommentWithAuthorDto[] = comments
      .slice(0, 10)
      .map((c) => ({
        ...c,
        isWatchlisted: false,
        matchedKeywords: [],
      })) as CommentWithAuthorDto[];

    filterBuilder.buildBaseWhere.mockReturnValue({});
    filterBuilder.buildReadStatusWhere.mockReturnValue({});
    filterBuilder.mergeWhere.mockReturnValue({});

    repository.findMany.mockResolvedValue(comments);
    repository.transaction.mockResolvedValue([20, 10, 10]);
    mapper.mapMany.mockReturnValue(mappedComments);

    const result = await strategy.execute({}, { limit: 10 });

    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBeTruthy();
    expect(result.items).toHaveLength(10);
  });

  it('должен возвращать null для nextCursor если hasMore = false', async () => {
    const comments: CommentWithRelations[] = [
      {
        id: 1,
        text: 'Comment',
        publishedAt: new Date(),
        isRead: false,
        watchlistAuthorId: null,
        author: null,
        commentKeywordMatches: [],
      },
    ];

    const mappedComments: CommentWithAuthorDto[] = comments.map((c) => ({
      ...c,
      isWatchlisted: false,
      matchedKeywords: [],
    })) as CommentWithAuthorDto[];

    filterBuilder.buildBaseWhere.mockReturnValue({});
    filterBuilder.buildReadStatusWhere.mockReturnValue({});
    filterBuilder.mergeWhere.mockReturnValue({});

    repository.findMany.mockResolvedValue(comments);
    repository.transaction.mockResolvedValue([1, 0, 1]);
    mapper.mapMany.mockReturnValue(mappedComments);

    const result = await strategy.execute({}, { limit: 10 });

    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it('должен использовать фильтры для построения where условий', async () => {
    filterBuilder.buildBaseWhere.mockReturnValue({ keywords: ['test'] });
    filterBuilder.buildReadStatusWhere.mockReturnValue({ isRead: false });
    filterBuilder.mergeWhere.mockReturnValue({
      keywords: ['test'],
      isRead: false,
    });

    repository.findMany.mockResolvedValue([]);
    repository.transaction.mockResolvedValue([0, 0, 0]);
    mapper.mapMany.mockReturnValue([]);

    await strategy.execute(
      { keywords: ['test'], readStatus: 'unread' },
      { limit: 10 },
    );

    expect(filterBuilder.buildBaseWhere).toHaveBeenCalledWith({
      keywords: ['test'],
      readStatus: 'unread',
    });
    expect(filterBuilder.buildReadStatusWhere).toHaveBeenCalledWith('unread');
  });
});

