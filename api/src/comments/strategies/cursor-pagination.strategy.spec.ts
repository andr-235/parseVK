import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CursorPaginationStrategy } from './cursor-pagination.strategy.js';
import {
  COMMENTS_REPOSITORY,
  type ICommentsRepository,
} from '../interfaces/comments-repository.interface.js';
import { CommentsFilterBuilder } from '../builders/comments-filter.builder.js';
import { CommentMapper } from '../mappers/comment.mapper.js';
import { CommentsStatsService } from '../services/comments-stats.service.js';
import { CursorUtils } from '../dto/comments-cursor.dto.js';
import type { CommentWithRelations } from '../interfaces/comments-repository.interface.js';
import type { CommentWithAuthorDto } from '../dto/comment-with-author.dto.js';

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
  let repository: vi.Mocked<ICommentsRepository>;
  let filterBuilder: vi.Mocked<CommentsFilterBuilder>;
  let mapper: vi.Mocked<CommentMapper>;
  let statsService: vi.Mocked<CommentsStatsService>;
  let repositoryObj: {
    findMany: vi.Mock;
    count: vi.Mock;
    update: vi.Mock;
    transaction: vi.Mock;
  };
  let filterBuilderObj: {
    buildBaseWhere: vi.Mock;
    buildReadStatusWhere: vi.Mock;
    mergeWhere: vi.Mock;
  };
  let mapperObj: {
    map: vi.Mock;
    mapMany: vi.Mock;
  };
  let statsServiceObj: {
    calculateStats: vi.Mock;
  };

  beforeEach(async () => {
    repositoryObj = {
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      transaction: vi.fn(),
    };
    repository = repositoryObj as never;

    filterBuilderObj = {
      buildBaseWhere: vi.fn(),
      buildReadStatusWhere: vi.fn(),
      mergeWhere: vi.fn(),
    };
    filterBuilder = filterBuilderObj as never;

    mapperObj = {
      map: vi.fn(),
      mapMany: vi.fn(),
    };
    mapper = mapperObj as never;

    statsServiceObj = {
      calculateStats: vi.fn(),
    };
    statsService = statsServiceObj as never;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CursorPaginationStrategy,
        {
          provide: COMMENTS_REPOSITORY,
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
        {
          provide: CommentsStatsService,
          useValue: statsService,
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
        createdAt: new Date('2024-01-01'),
        isRead: false,
      }),
    ];

    const mappedComments: CommentWithAuthorDto[] = realMapper.mapMany(comments);

    filterBuilderObj.buildBaseWhere.mockReturnValue({});
    filterBuilderObj.buildReadStatusWhere.mockReturnValue({});
    filterBuilderObj.mergeWhere.mockReturnValue({});
    repositoryObj.findMany.mockResolvedValue(comments);
    statsServiceObj.calculateStats.mockResolvedValue({
      total: 10,
      readCount: 5,
      unreadCount: 5,
    });
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
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    expect(statsServiceObj.calculateStats).toHaveBeenCalledWith({}, undefined);
  });

  it('должен декодировать cursor и использовать его для пагинации', async () => {
    const createdAt = new Date('2024-01-01');
    const id = 123;
    const cursor = CursorUtils.encode(createdAt, id);

    const comments: CommentWithRelations[] = [
      createMockComment({
        id: 124,
        text: 'Comment',
        createdAt: new Date('2024-01-02'),
        isRead: false,
      }),
    ];

    const mappedComments: CommentWithAuthorDto[] = realMapper.mapMany(comments);

    filterBuilderObj.buildBaseWhere.mockReturnValue({});
    filterBuilderObj.buildReadStatusWhere.mockReturnValue({});
    filterBuilderObj.mergeWhere.mockReturnValue({
      OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: id } }],
    });
    repositoryObj.findMany.mockResolvedValue(comments);
    statsServiceObj.calculateStats.mockResolvedValue({
      total: 10,
      readCount: 5,
      unreadCount: 5,
    });
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
    expect(statsServiceObj.calculateStats).toHaveBeenCalledWith({}, undefined);
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
          createdAt: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
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
    statsServiceObj.calculateStats.mockResolvedValue({
      total: 20,
      readCount: 10,
      unreadCount: 10,
    });
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
        createdAt: new Date(),
        isRead: false,
      }),
    ];

    const mappedComments: CommentWithAuthorDto[] = realMapper.mapMany(comments);

    filterBuilderObj.buildBaseWhere.mockReturnValue({});
    filterBuilderObj.buildReadStatusWhere.mockReturnValue({});
    filterBuilderObj.mergeWhere.mockReturnValue({});
    repositoryObj.findMany.mockResolvedValue(comments);
    statsServiceObj.calculateStats.mockResolvedValue({
      total: 1,
      readCount: 0,
      unreadCount: 1,
    });
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
    statsServiceObj.calculateStats.mockResolvedValue({
      total: 0,
      readCount: 0,
      unreadCount: 0,
    });
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
    expect(statsServiceObj.calculateStats).toHaveBeenCalledWith(
      { keywords: ['test'], readStatus: 'unread' },
      'unread',
    );
  });
});
