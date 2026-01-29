import { vi } from 'vitest';
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
  let repository: vi.Mocked<ICommentsRepository>;
  let offsetStrategy: vi.Mocked<OffsetPaginationStrategy>;
  let cursorStrategy: vi.Mocked<CursorPaginationStrategy>;
  let mapper: vi.Mocked<CommentMapper>;
  let repositoryObj: {
    findMany: vi.Mock<Promise<CommentWithRelations[]>, [unknown]>;
    count: vi.Mock<Promise<number>, [unknown]>;
    update: vi.Mock<Promise<CommentWithRelations>, [unknown]>;
    transaction: vi.Mock<Promise<unknown[]>, [unknown[]]>;
  };
  let offsetStrategyObj: {
    execute: vi.Mock<Promise<CommentsListDto>, [unknown, unknown]>;
  };
  let cursorStrategyObj: {
    execute: vi.Mock<Promise<CommentsCursorListDto>, [unknown, unknown]>;
  };
  let mapperObj: {
    map: vi.Mock<CommentWithAuthorDto, [CommentWithRelations]>;
    mapMany: vi.Mock<CommentWithAuthorDto[], [CommentWithRelations[]]>;
  };

  beforeEach(() => {
    repositoryObj = {
      findMany: vi.fn<Promise<CommentWithRelations[]>, [unknown]>(),
      count: vi.fn<Promise<number>, [unknown]>(),
      update: vi.fn<Promise<CommentWithRelations>, [unknown]>(),
      transaction: vi.fn<Promise<unknown[]>, [unknown[]]>(),
    };
    repository = repositoryObj as never;

    offsetStrategyObj = {
      execute: vi.fn<Promise<CommentsListDto>, [unknown, unknown]>(),
    };
    offsetStrategy = offsetStrategyObj as never;

    cursorStrategyObj = {
      execute: vi.fn<Promise<CommentsCursorListDto>, [unknown, unknown]>(),
    };
    cursorStrategy = cursorStrategyObj as never;

    mapperObj = {
      map: vi.fn<CommentWithAuthorDto, [CommentWithRelations]>(),
      mapMany: vi.fn<CommentWithAuthorDto[], [CommentWithRelations[]]>(),
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
