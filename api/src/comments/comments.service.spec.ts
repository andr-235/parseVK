import { CommentsService } from './comments.service';
import type { ICommentsRepository } from './interfaces/comments-repository.interface';
import type { CommentWithRelations } from './interfaces/comments-repository.interface';
import { OffsetPaginationStrategy } from './strategies/offset-pagination.strategy';
import { CursorPaginationStrategy } from './strategies/cursor-pagination.strategy';
import { CommentMapper } from './mappers/comment.mapper';
import { CommentsQueryValidator } from './validators/comments-query.validator';
import type { CommentWithAuthorDto } from './dto/comment-with-author.dto';
import type { CommentsListDto } from './dto/comments-list.dto';
import type { CommentsCursorListDto } from './dto/comments-cursor-list.dto';
import type {
  ReadStatusFilter,
  KeywordSourceFilter,
} from './types/comments-filters.type';

describe('CommentsService', () => {
  let service: CommentsService;
  let repository: jest.Mocked<ICommentsRepository>;
  let offsetStrategy: jest.Mocked<OffsetPaginationStrategy>;
  let cursorStrategy: jest.Mocked<CursorPaginationStrategy>;
  let mapper: jest.Mocked<CommentMapper>;
  let queryValidator: jest.Mocked<CommentsQueryValidator>;
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
  let queryValidatorObj: {
    parseKeywords: jest.Mock<
      string[] | undefined,
      [string | string[] | undefined]
    >;
    normalizeReadStatus: jest.Mock<ReadStatusFilter, [string | undefined]>;
    normalizeSearch: jest.Mock<string | undefined, [string | undefined]>;
    normalizeOffset: jest.Mock<number, [number]>;
    normalizeLimit: jest.Mock<number, [number]>;
    normalizeLimitWithDefault: jest.Mock<number, [number | undefined]>;
    normalizeKeywordSource: jest.Mock<
      KeywordSourceFilter | undefined,
      [string | undefined]
    >;
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

    queryValidatorObj = {
      parseKeywords: jest.fn<
        string[] | undefined,
        [string | string[] | undefined]
      >(),
      normalizeReadStatus: jest.fn<ReadStatusFilter, [string | undefined]>(),
      normalizeSearch: jest.fn<string | undefined, [string | undefined]>(),
      normalizeOffset: jest.fn<number, [number]>(),
      normalizeLimit: jest.fn<number, [number]>(),
      normalizeLimitWithDefault: jest.fn<number, [number | undefined]>(),
      normalizeKeywordSource: jest.fn<
        KeywordSourceFilter | undefined,
        [string | undefined]
      >(),
    };
    queryValidator = queryValidatorObj as never;

    service = new CommentsService(
      repository,
      offsetStrategy,
      cursorStrategy,
      mapper,
      queryValidator,
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
