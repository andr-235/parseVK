import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { OffsetPaginationStrategy } from './offset-pagination.strategy.js';
import {
  COMMENTS_REPOSITORY,
  type ICommentsRepository,
} from '../interfaces/comments-repository.interface.js';
import { CommentsFilterBuilder } from '../builders/comments-filter.builder.js';
import { CommentMapper } from '../mappers/comment.mapper.js';
import { CommentsStatsService } from '../services/comments-stats.service.js';
import type { CommentWithRelations } from '../interfaces/comments-repository.interface.js';
import type { CommentWithAuthorDto } from '../dto/comment-with-author.dto.js';

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

const realMapper = new CommentMapper();

describe('OffsetPaginationStrategy', () => {
  let strategy: OffsetPaginationStrategy;
  let repositoryMock: vi.Mocked<ICommentsRepository>;
  let filterBuilderMock: vi.Mocked<CommentsFilterBuilder>;
  let mapperMock: vi.Mocked<CommentMapper>;
  let statsServiceMock: vi.Mocked<CommentsStatsService>;
  let repositoryObj: {
    findMany: vi.Mock;
    count: vi.Mock;
    update: vi.Mock;
    transaction: vi.Mock;
  };
  let filterBuilderObj: {
    buildWhere: vi.Mock;
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
    repositoryMock = repositoryObj as never;

    filterBuilderObj = {
      buildWhere: vi.fn(),
    };
    filterBuilderMock = filterBuilderObj as never;

    mapperObj = {
      map: vi.fn(),
      mapMany: vi.fn(),
    };
    mapperMock = mapperObj as never;

    statsServiceObj = {
      calculateStats: vi.fn(),
    };
    statsServiceMock = statsServiceObj as never;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffsetPaginationStrategy,
        {
          provide: COMMENTS_REPOSITORY,
          useValue: repositoryMock,
        },
        {
          provide: CommentsFilterBuilder,
          useValue: filterBuilderMock,
        },
        {
          provide: CommentMapper,
          useValue: mapperMock,
        },
        {
          provide: CommentsStatsService,
          useValue: statsServiceMock,
        },
      ],
    }).compile();

    strategy = module.get<OffsetPaginationStrategy>(OffsetPaginationStrategy);
  });

  it('должен возвращать пагинированный список комментариев', async () => {
    const comments: CommentWithRelations[] = [
      createMockComment({
        id: 1,
        text: 'Comment 1',
        publishedAt: new Date(),
        isRead: false,
      }),
      createMockComment({
        id: 2,
        text: 'Comment 2',
        publishedAt: new Date(),
        isRead: true,
      }),
    ];

    const mappedComments: CommentWithAuthorDto[] = realMapper.mapMany(comments);

    filterBuilderObj.buildWhere.mockReturnValue({});
    repositoryObj.findMany.mockResolvedValue(comments);
    statsServiceObj.calculateStats.mockResolvedValue({
      total: 2,
      readCount: 1,
      unreadCount: 1,
    });
    mapperObj.mapMany.mockReturnValue(mappedComments);

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

    expect(filterBuilderObj.buildWhere).toHaveBeenCalledWith({
      keywords: ['test'],
      readStatus: 'all',
    });
    expect(repositoryObj.findMany).toHaveBeenCalledTimes(1);
    expect(statsServiceObj.calculateStats).toHaveBeenCalledWith(
      { keywords: ['test'], readStatus: 'all' },
      'all',
    );
    expect(mapperObj.mapMany).toHaveBeenCalledWith(comments);
  });

  it('должен правильно вычислять hasMore', async () => {
    const comments: CommentWithRelations[] = Array.from(
      { length: 10 },
      (_, i) =>
        createMockComment({
          id: i + 1,
          text: `Comment ${i + 1}`,
          publishedAt: new Date(),
          isRead: false,
        }),
    );

    const mappedComments: CommentWithAuthorDto[] = realMapper.mapMany(comments);

    filterBuilderObj.buildWhere.mockReturnValue({});
    repositoryObj.findMany.mockResolvedValue(comments);
    statsServiceObj.calculateStats.mockResolvedValue({
      total: 20,
      readCount: 10,
      unreadCount: 10,
    });
    mapperObj.mapMany.mockReturnValue(mappedComments);

    const result = await strategy.execute({}, { offset: 0, limit: 10 });

    expect(result.hasMore).toBe(true);
    expect(result.total).toBe(20);
  });

  it('должен использовать фильтры для построения where условий', async () => {
    filterBuilderObj.buildWhere.mockReturnValue({
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
      { offset: 0, limit: 10 },
    );

    expect(filterBuilderObj.buildWhere).toHaveBeenCalledWith({
      keywords: ['test'],
      readStatus: 'unread',
    });
    expect(statsServiceObj.calculateStats).toHaveBeenCalledWith(
      { keywords: ['test'], readStatus: 'unread' },
      'unread',
    );
  });
});
