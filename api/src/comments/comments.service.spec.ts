import { CommentsService } from './comments.service';
import type { ICommentsRepository } from './interfaces/comments-repository.interface';
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

  beforeEach(() => {
    repository = {
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      transaction: jest.fn(),
    } as never;

    offsetStrategy = {
      execute: jest.fn(),
    } as never;

    cursorStrategy = {
      execute: jest.fn(),
    } as never;

    mapper = {
      map: jest.fn(),
      mapMany: jest.fn(),
    } as never;

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

    offsetStrategy.execute.mockResolvedValue(expectedResult);

    const result = await service.getComments({
      offset: 0,
      limit: 100,
      keywords: ['test'],
      readStatus: 'all',
      search: 'demo',
    });

    expect(result).toBe(expectedResult);
    expect(offsetStrategy.execute).toHaveBeenCalledWith(
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

    cursorStrategy.execute.mockResolvedValue(expectedResult);

    const result = await service.getCommentsCursor({
      cursor: 'test-cursor',
      limit: 50,
      keywords: ['keyword'],
      readStatus: 'unread',
    });

    expect(result).toBe(expectedResult);
    expect(cursorStrategy.execute).toHaveBeenCalledWith(
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
    };

    const mappedComment: CommentWithAuthorDto = {
      id: 1,
      text: 'Test',
      publishedAt: new Date(),
      isRead: true,
      watchlistAuthorId: null,
      author: null,
      isWatchlisted: false,
      matchedKeywords: [],
    } as CommentWithAuthorDto;

    repository.update.mockResolvedValue(commentFromRepo);
    mapper.map.mockReturnValue(mappedComment);

    const result = await service.setReadStatus(1, true);

    expect(result).toBe(mappedComment);
    expect(repository.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { isRead: true },
    });
    expect(mapper.map).toHaveBeenCalledWith(commentFromRepo);
  });
});
