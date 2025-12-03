import { Test, TestingModule } from '@nestjs/testing';
import { OffsetPaginationStrategy } from './offset-pagination.strategy';
import type { ICommentsRepository } from '../interfaces/comments-repository.interface';
import { CommentsFilterBuilder } from '../builders/comments-filter.builder';
import { CommentMapper } from '../mappers/comment.mapper';
import type { CommentWithRelations } from '../interfaces/comments-repository.interface';
import type { CommentWithAuthorDto } from '../dto/comment-with-author.dto';

describe('OffsetPaginationStrategy', () => {
  let strategy: OffsetPaginationStrategy;
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
        OffsetPaginationStrategy,
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

    strategy = module.get<OffsetPaginationStrategy>(OffsetPaginationStrategy);
  });

  it('должен возвращать пагинированный список комментариев', async () => {
    const comments: CommentWithRelations[] = [
      {
        id: 1,
        text: 'Comment 1',
        publishedAt: new Date(),
        isRead: false,
        watchlistAuthorId: null,
        author: null,
        commentKeywordMatches: [],
      },
      {
        id: 2,
        text: 'Comment 2',
        publishedAt: new Date(),
        isRead: true,
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

    repository.transaction.mockResolvedValue([comments, 2, 1, 1]);
    mapper.mapMany.mockReturnValue(mappedComments);

    const result = await strategy.execute(
      { keywords: ['test'], readStatus: 'all' },
      { offset: 0, limit: 10 },
    );

    expect(result).toEqual({
      items: mappedComments,
      total: 2,
      hasMore: false,
      readCount: 1,
      unreadCount: 1,
    });

    expect(repository.transaction).toHaveBeenCalledTimes(1);
    expect(repository.transaction).toHaveBeenCalledWith(expect.any(Array));
    expect(repository.transaction.mock.calls[0][0]).toHaveLength(4);
    expect(mapper.mapMany).toHaveBeenCalledWith(comments);
  });

  it('должен правильно вычислять hasMore', async () => {
    const comments: CommentWithRelations[] = Array.from(
      { length: 10 },
      (_, i) => ({
        id: i + 1,
        text: `Comment ${i + 1}`,
        publishedAt: new Date(),
        isRead: false,
        watchlistAuthorId: null,
        author: null,
        commentKeywordMatches: [],
      }),
    );

    const mappedComments: CommentWithAuthorDto[] = comments.map((c) => ({
      ...c,
      isWatchlisted: false,
      matchedKeywords: [],
    })) as CommentWithAuthorDto[];

    filterBuilder.buildBaseWhere.mockReturnValue({});
    filterBuilder.buildReadStatusWhere.mockReturnValue({});
    filterBuilder.mergeWhere.mockReturnValue({});

    repository.transaction.mockResolvedValue([comments, 20, 10, 10]);
    mapper.mapMany.mockReturnValue(mappedComments);

    const result = await strategy.execute({}, { offset: 0, limit: 10 });

    expect(result.hasMore).toBe(true);
    expect(result.total).toBe(20);
  });

  it('должен использовать фильтры для построения where условий', async () => {
    filterBuilder.buildBaseWhere.mockReturnValue({ keywords: ['test'] });
    filterBuilder.buildReadStatusWhere.mockReturnValue({ isRead: false });
    filterBuilder.mergeWhere.mockReturnValue({
      keywords: ['test'],
      isRead: false,
    });

    repository.transaction.mockResolvedValue([[], 0, 0, 0]);
    mapper.mapMany.mockReturnValue([]);

    await strategy.execute(
      { keywords: ['test'], readStatus: 'unread' },
      { offset: 0, limit: 10 },
    );

    expect(filterBuilder.buildBaseWhere).toHaveBeenCalledWith({
      keywords: ['test'],
      readStatus: 'unread',
    });
    expect(filterBuilder.buildReadStatusWhere).toHaveBeenCalledWith('unread');
  });
});
