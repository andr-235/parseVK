import { CommentsService } from './comments.service';
import type { ICommentsRepository } from './interfaces/comments-repository.interface';
import type { CommentWithRelations } from './interfaces/comments-repository.interface';
import { OffsetPaginationStrategy } from './strategies/offset-pagination.strategy';
import { CursorPaginationStrategy } from './strategies/cursor-pagination.strategy';
import { CommentMapper } from './mappers/comment.mapper';
import type { CommentWithAuthorDto } from './dto/comment-with-author.dto';
import type { CommentsListDto } from './dto/comments-list.dto';
import type { CommentsCursorListDto } from './dto/comments-cursor-list.dto';

describe('CommentsService', () => {
  let service: CommentsService;
  let repository: jest.Mocked<ICommentsRepository>;
  let offsetStrategy: jest.Mocked<OffsetPaginationStrategy>;
  let cursorStrategy: jest.Mocked<CursorPaginationStrategy>;
  let mapper: jest.Mocked<CommentMapper>;
  let repositoryObj: {
    findMany: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
    transaction: jest.Mock;
  };
  let offsetStrategyObj: {
    execute: jest.Mock;
  };
  let cursorStrategyObj: {
    execute: jest.Mock;
  };
  let mapperObj: {
    map: jest.Mock;
    mapMany: jest.Mock;
  };

  beforeEach(() => {
    repositoryObj = {
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      transaction: jest.fn(),
    };
    repository = repositoryObj as never;

    offsetStrategyObj = {
      execute: jest.fn(),
    };
    offsetStrategy = offsetStrategyObj as never;

    cursorStrategyObj = {
      execute: jest.fn(),
    };
    cursorStrategy = cursorStrategyObj as never;

    mapperObj = {
      map: jest.fn(),
      mapMany: jest.fn(),
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
