import { Test, TestingModule } from '@nestjs/testing';
import { OffsetPaginationStrategy } from './offset-pagination.strategy';
import type { ICommentsRepository } from '../interfaces/comments-repository.interface';
import { CommentsFilterBuilder } from '../builders/comments-filter.builder';
import { CommentMapper } from '../mappers/comment.mapper';
import type { CommentWithRelations } from '../interfaces/comments-repository.interface';
import type { CommentWithAuthorDto } from '../dto/comment-with-author.dto';

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
  let repositoryMock: jest.Mocked<ICommentsRepository>;
  let filterBuilderMock: jest.Mocked<CommentsFilterBuilder>;
  let mapperMock: jest.Mocked<CommentMapper>;
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
    repositoryMock = repositoryObj as never;

    filterBuilderObj = {
      buildBaseWhere: jest.fn(),
      buildReadStatusWhere: jest.fn(),
      mergeWhere: jest.fn(),
    };
    filterBuilderMock = filterBuilderObj as never;

    mapperObj = {
      map: jest.fn(),
      mapMany: jest.fn(),
    };
    mapperMock = mapperObj as never;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffsetPaginationStrategy,
        {
          provide: 'ICommentsRepository',
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

    filterBuilderObj.buildBaseWhere.mockReturnValue({});
    filterBuilderObj.buildReadStatusWhere.mockReturnValue({});
    filterBuilderObj.mergeWhere.mockReturnValue({});
    repositoryObj.findMany.mockResolvedValue(comments);
    repositoryObj.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
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

    expect(repositoryObj.findMany).toHaveBeenCalledTimes(1);
    expect(repositoryObj.count).toHaveBeenCalledTimes(3);
    const calls = repositoryObj.transaction.mock.calls;
    if (calls[0] && Array.isArray(calls[0])) {
      const firstCall = calls[0] as unknown[];
      if (firstCall[0] && Array.isArray(firstCall[0])) {
        expect(firstCall[0]).toHaveLength(4);
      }
    }
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

    filterBuilderObj.buildBaseWhere.mockReturnValue({});
    filterBuilderObj.buildReadStatusWhere.mockReturnValue({});
    filterBuilderObj.mergeWhere.mockReturnValue({});
    repositoryObj.findMany.mockResolvedValue(comments);
    repositoryObj.count
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(10);
    mapperObj.mapMany.mockReturnValue(mappedComments);

    const result = await strategy.execute({}, { offset: 0, limit: 10 });

    expect(result.hasMore).toBe(true);
    expect(result.total).toBe(20);
  });

  it('должен использовать фильтры для построения where условий', async () => {
    filterBuilderObj.buildBaseWhere.mockReturnValue({ keywords: ['test'] });
    filterBuilderObj.buildReadStatusWhere.mockReturnValue({ isRead: false });
    filterBuilderObj.mergeWhere.mockReturnValue({
      keywords: ['test'],
      isRead: false,
    });
    repositoryObj.findMany.mockResolvedValue([]);
    repositoryObj.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    mapperObj.mapMany.mockReturnValue([]);

    await strategy.execute(
      { keywords: ['test'], readStatus: 'unread' },
      { offset: 0, limit: 10 },
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
