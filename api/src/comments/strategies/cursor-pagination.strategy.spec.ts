import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CursorPaginationStrategy } from './cursor-pagination.strategy';
import type { ICommentsRepository } from '../interfaces/comments-repository.interface';
import { CommentsFilterBuilder } from '../builders/comments-filter.builder';
import { CommentMapper } from '../mappers/comment.mapper';
import { CursorUtils } from '../dto/comments-cursor.dto';
import type { CommentWithRelations } from '../interfaces/comments-repository.interface';
import type { CommentWithAuthorDto } from '../dto/comment-with-author.dto';

const realMapper = new CommentMapper();

const createMockPost = () => ({
  text: 'Post text',
  attachments: null,
  group: null,
});

const createMockComment = (overrides = {}): CommentWithRelations =>
  ({
    id: 1,
    postId: 1,
    ownerId: -123,
    vkCommentId: 456,
    fromId: 123,
    text: 'Test',
    publishedAt: new Date(),
    likesCount: null,
    parentsStack: null,
    threadCount: null,
    threadItems: null,
    attachments: null,
    replyToUser: null,
    replyToComment: null,
    isRead: false,
    isDeleted: false,
    source: 'TASK',
    watchlistAuthorId: null,
    authorVkId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: null,
    commentKeywordMatches: [],
    post: createMockPost(),
    ...overrides,
  }) as CommentWithRelations;

describe('CursorPaginationStrategy', () => {
  let strategy: CursorPaginationStrategy;
  let repository: jest.Mocked<ICommentsRepository>;
  let filterBuilder: jest.Mocked<CommentsFilterBuilder>;
  let mapper: jest.Mocked<CommentMapper>;
  let repositoryObj: {
    findMany: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
    transaction: jest.Mock;
  };
  let filterBuilderObj: {
    buildBaseWhere: jest.Mock;
    buildReadStatusWhere: jest.Mock;
    mergeWhere: jest.Mock;
  };
  let mapperObj: {
    map: jest.Mock;
    mapMany: jest.Mock;
  };

  beforeEach(async () => {
    repositoryObj = {
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      transaction: jest.fn(),
    };
    repository = repositoryObj as never;

    filterBuilderObj = {
      buildBaseWhere: jest.fn(),
      buildReadStatusWhere: jest.fn(),
      mergeWhere: jest.fn(),
    };
    filterBuilder = filterBuilderObj as never;

    mapperObj = {
      map: jest.fn(),
      mapMany: jest.fn(),
    };
    mapper = mapperObj as never;

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
      createMockComment({
        id: 1,
        text: 'Comment 1',
        publishedAt: new Date('2024-01-01'),
        isRead: false,
      }),
    ];

    const mappedComments: CommentWithAuthorDto[] = realMapper.mapMany(comments);

    filterBuilderObj.buildBaseWhere.mockReturnValue({});
    filterBuilderObj.buildReadStatusWhere.mockReturnValue({});
    filterBuilderObj.mergeWhere.mockReturnValue({});

    repositoryObj.findMany.mockResolvedValue(comments);
    repositoryObj.transaction.mockResolvedValue([10, 5, 5]);
    mapperObj.mapMany.mockReturnValue(mappedComments);

    const result = await strategy.execute({}, { limit: 10 });

    expect(result).toEqual({
      items: mappedComments,
      nextCursor: null,
      hasMore: false,
      total: 10,
      readCount: 5,
      unreadCount: 5,
    });

    expect(repositoryObj.findMany).toHaveBeenCalledWith({
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
      createMockComment({
        id: 124,
        text: 'Comment',
        publishedAt: new Date('2024-01-02'),
        isRead: false,
      }),
    ];

    const mappedComments: CommentWithAuthorDto[] = realMapper.mapMany(comments);

    filterBuilderObj.buildBaseWhere.mockReturnValue({});
    filterBuilderObj.buildReadStatusWhere.mockReturnValue({});
    filterBuilderObj.mergeWhere.mockReturnValue({
      OR: [
        { publishedAt: { lt: publishedAt } },
        { publishedAt, id: { lt: id } },
      ],
    });
    repositoryObj.findMany.mockResolvedValue(comments);
    repositoryObj.transaction.mockResolvedValue([10, 5, 5]);
    mapperObj.mapMany.mockReturnValue(mappedComments);

    const result = await strategy.execute({}, { cursor, limit: 10 });

    expect(result.items).toEqual(mappedComments);
    const orMatcher = expect.any(Array) as unknown;
    expect(filterBuilderObj.mergeWhere).toHaveBeenCalledWith(
      {},
      {},
      expect.objectContaining({
        OR: orMatcher,
      }),
    );
  });

  it('должен выбрасывать BadRequestException для невалидного cursor', async () => {
    await expect(
      strategy.execute({}, { cursor: 'invalid-cursor', limit: 10 }),
    ).rejects.toThrow(BadRequestException);

    expect(repositoryObj.findMany).not.toHaveBeenCalled();
  });

  it('должен генерировать nextCursor если hasMore = true', async () => {
    const comments: CommentWithRelations[] = Array.from(
      { length: 11 },
      (_, i) =>
        createMockComment({
          id: i + 1,
          text: `Comment ${i + 1}`,
          publishedAt: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
          isRead: false,
        }),
    );

    const mappedComments: CommentWithAuthorDto[] = realMapper.mapMany(
      comments.slice(0, 10),
    );

    filterBuilderObj.buildBaseWhere.mockReturnValue({});
    filterBuilderObj.buildReadStatusWhere.mockReturnValue({});
    filterBuilderObj.mergeWhere.mockReturnValue({});
    repositoryObj.findMany.mockResolvedValue(comments);
    repositoryObj.transaction.mockResolvedValue([20, 10, 10]);
    mapperObj.mapMany.mockReturnValue(mappedComments);

    const result = await strategy.execute({}, { limit: 10 });

    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBeTruthy();
    expect(result.items).toHaveLength(10);
  });

  it('должен возвращать null для nextCursor если hasMore = false', async () => {
    const comments: CommentWithRelations[] = [
      createMockComment({
        id: 1,
        text: 'Comment',
        publishedAt: new Date(),
        isRead: false,
      }),
    ];

    const mappedComments: CommentWithAuthorDto[] = realMapper.mapMany(comments);

    filterBuilderObj.buildBaseWhere.mockReturnValue({});
    filterBuilderObj.buildReadStatusWhere.mockReturnValue({});
    filterBuilderObj.mergeWhere.mockReturnValue({});
    repositoryObj.findMany.mockResolvedValue(comments);
    repositoryObj.transaction.mockResolvedValue([1, 0, 1]);
    mapperObj.mapMany.mockReturnValue(mappedComments);

    const result = await strategy.execute({}, { limit: 10 });

    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it('должен использовать фильтры для построения where условий', async () => {
    filterBuilderObj.buildBaseWhere.mockReturnValue({ keywords: ['test'] });
    filterBuilderObj.buildReadStatusWhere.mockReturnValue({ isRead: false });
    filterBuilderObj.mergeWhere.mockReturnValue({
      keywords: ['test'],
      isRead: false,
    });
    repositoryObj.findMany.mockResolvedValue([]);
    repositoryObj.transaction.mockResolvedValue([0, 0, 0]);
    mapperObj.mapMany.mockReturnValue([]);

    await strategy.execute(
      { keywords: ['test'], readStatus: 'unread' },
      { limit: 10 },
    );

    expect(filterBuilderObj.buildBaseWhere).toHaveBeenCalledWith({
      keywords: ['test'],
      readStatus: 'unread',
    });
    expect(filterBuilderObj.buildReadStatusWhere).toHaveBeenCalledWith(
      'unread',
    );
  });
});
