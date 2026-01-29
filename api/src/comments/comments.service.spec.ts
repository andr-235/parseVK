import { CommentsService } from './comments.service.js';
import type { ICommentsRepository } from './interfaces/comments-repository.interface.js';
import type { CommentWithRelations } from './interfaces/comments-repository.interface.js';
import { OffsetPaginationStrategy } from './strategies/offset-pagination.strategy.js';
import { CursorPaginationStrategy } from './strategies/cursor-pagination.strategy.js';
import { CommentMapper } from './mappers/comment.mapper.js';
import type { CommentWithAuthorDto } from './dto/comment-with-author.dto.js';
import type { CommentsListDto } from './dto/comments-list.dto.js';
import type { CommentsCursorListDto } from './dto/comments-cursor-list.dto.js';

describe('CommentsService', () => {
  let service: CommentsService;
  let repository: jest.Mocked<ICommentsRepository>;
  let offsetStrategy: jest.Mocked<OffsetPaginationStrategy>;
  let cursorStrategy: jest.Mocked<CursorPaginationStrategy>;
  let mapper: jest.Mocked<CommentMapper>;
  let repositoryObj: {
    findMany: jest.Mock<Promise<CommentWithRelations[]>, [unknown]>;
    count: jest.Mock<Promise<number>, [unknown]>;
    update: jest.Mock<Promise<CommentWithRelations>, [unknown]>;
    transaction: jest.Mock<Promise<unknown[]>, [unknown[]]>;
  };
  let offsetStrategyObj: {
    execute: jest.Mock<Promise<CommentsListDto>, [unknown, unknown]>;
  };
  let cursorStrategyObj: {
    execute: jest.Mock<Promise<CommentsCursorListDto>, [unknown, unknown]>;
  };
  let mapperObj: {
    map: jest.Mock<CommentWithAuthorDto, [CommentWithRelations]>;
    mapMany: jest.Mock<CommentWithAuthorDto[], [CommentWithRelations[]]>;
  };

  beforeEach(() => {
    repositoryObj = {
      findMany: jest.fn<Promise<CommentWithRelations[]>, [unknown]>(),
      count: jest.fn<Promise<number>, [unknown]>(),
      update: jest.fn<Promise<CommentWithRelations>, [unknown]>(),
      transaction: jest.fn<Promise<unknown[]>, [unknown[]]>(),
    };
    repository = repositoryObj as never;

    offsetStrategyObj = {
      execute: jest.fn<Promise<CommentsListDto>, [unknown, unknown]>(),
    };
    offsetStrategy = offsetStrategyObj as never;

    cursorStrategyObj = {
      execute: jest.fn<Promise<CommentsCursorListDto>, [unknown, unknown]>(),
    };
    cursorStrategy = cursorStrategyObj as never;

    mapperObj = {
      map: jest.fn<CommentWithAuthorDto, [CommentWithRelations]>(),
      mapMany: jest.fn<CommentWithAuthorDto[], [CommentWithRelations[]]>(),
    };
    mapper = mapperObj as never;

    service = new CommentsService(
      repository,
      offsetStrategy,
      cursorStrategy,
      mapper,
    );
  });

  it('должен вызывать offset стратегию для getComments', async () => {
    const expectedResult: CommentsListDto = {
      items: [],
      total: 0,
      hasMore: false,
      readCount: 0,
      unreadCount: 0,
    };

    offsetStrategyObj.execute.mockResolvedValue(expectedResult);

    const result = await service.getComments({
      offset: 0,
      limit: 100,
      keywords: ['test'],
      readStatus: 'all',
      search: 'demo',
    });

    expect(result).toBe(expectedResult);
    expect(offsetStrategyObj.execute).toHaveBeenCalledWith(
      { keywords: ['test'], readStatus: 'all', search: 'demo' },
      { offset: 0, limit: 100 },
    );
  });

  it('должен вызывать cursor стратегию для getCommentsCursor', async () => {
    const expectedResult: CommentsCursorListDto = {
      items: [],
      nextCursor: null,
      hasMore: false,
      total: 0,
      readCount: 0,
      unreadCount: 0,
    };

    cursorStrategyObj.execute.mockResolvedValue(expectedResult);

    const result = await service.getCommentsCursor({
      cursor: 'test-cursor',
      limit: 50,
      keywords: ['keyword'],
      readStatus: 'unread',
    });

    expect(result).toBe(expectedResult);
    expect(cursorStrategyObj.execute).toHaveBeenCalledWith(
      { keywords: ['keyword'], readStatus: 'unread' },
      { cursor: 'test-cursor', limit: 50 },
    );
  });

  it('должен обновлять статус прочтения комментария', async () => {
    const commentFromRepo = {
      id: 1,
      text: 'Test',
      publishedAt: new Date(),
      isRead: true,
      watchlistAuthorId: null,
      author: null,
      commentKeywordMatches: [],
      post: {
        text: null,
        attachments: null,
        group: null,
      },
    } as unknown as CommentWithRelations;

    const mappedComment: CommentWithAuthorDto = {
      id: 1,
      text: 'Test',
      publishedAt: new Date(),
      isRead: true,
      watchlistAuthorId: null,
      author: null,
      isWatchlisted: false,
      matchedKeywords: [],
    } as unknown as CommentWithAuthorDto;

    repositoryObj.update.mockResolvedValue(commentFromRepo);
    mapperObj.map.mockReturnValue(mappedComment);

    const result = await service.setReadStatus(1, true);

    expect(result).toBe(mappedComment);
    expect(repositoryObj.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { isRead: true },
    });
    expect(mapperObj.map).toHaveBeenCalledWith(commentFromRepo);
  });
});
