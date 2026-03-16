import { vi } from 'vitest';
import { CommentsSaverService } from './comments-saver.service.js';
import { CommentSource } from '../types/comment-source.enum.js';
import { MatchSource } from '../types/match-source.enum.js';
import type { PrismaService } from '../../prisma.service.js';
import type { CommentEntity } from '../types/comment-entity.type.js';
import type { CommentsSearchIndexerService } from '../../comments-search/services/comments-search-indexer.service.js';

const baseComment: CommentEntity = {
  postId: 10,
  ownerId: -100,
  vkCommentId: 501,
  fromId: 42,
  text: 'Тестовый комментарий с ёжиком',
  publishedAt: new Date('2024-06-01T12:00:00.000Z'),
  likesCount: null,
  parentsStack: null,
  threadCount: null,
  threadItems: null,
  attachments: null,
  replyToUser: null,
  replyToComment: null,
  isDeleted: false,
};

describe('CommentsSaverService', () => {
  let service: CommentsSaverService;
  let searchIndexerMock: {
    indexCommentById: ReturnType<typeof vi.fn>;
    indexCommentsByPost: ReturnType<typeof vi.fn>;
  };
  let prismaMock: {
    comment: {
      upsert: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    post: {
      findUnique: ReturnType<typeof vi.fn>;
    };
    keyword: {
      findMany: ReturnType<typeof vi.fn>;
    };
    commentKeywordMatch: {
      findMany: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
      createMany: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    searchIndexerMock = {
      indexCommentById: vi.fn().mockResolvedValue(undefined),
      indexCommentsByPost: vi.fn().mockResolvedValue(undefined),
    };

    prismaMock = {
      comment: {
        upsert: vi.fn().mockResolvedValue({ id: 99 }),
        findMany: vi.fn().mockResolvedValue([{ id: 99 }, { id: 100 }]),
      },
      post: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: 1, ownerId: -100, postId: 10 }),
      },
      keyword: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      commentKeywordMatch: {
        findMany: vi.fn().mockResolvedValue([]),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: vi.fn().mockImplementation(async (arg: unknown) => {
        if (typeof arg === 'function') {
          return (arg as (tx: typeof prismaMock) => Promise<unknown>)(
            prismaMock as unknown as typeof prismaMock,
          );
        }
        if (Array.isArray(arg)) {
          return Promise.all(arg);
        }
        throw new Error('Unsupported transaction input');
      }),
    };

    service = new CommentsSaverService(
      prismaMock as unknown as PrismaService,
      searchIndexerMock as unknown as CommentsSearchIndexerService,
    );
  });

  describe('saveComments', () => {
    it('возвращает 0 если массив пустой', async () => {
      const result = await service.saveComments([], {
        source: CommentSource.TASK,
      });
      expect(result).toBe(0);
      expect(prismaMock.comment.upsert).not.toHaveBeenCalled();
    });

    it('делает upsert для каждого комментария', async () => {
      const comments = [
        { ...baseComment, vkCommentId: 1 },
        { ...baseComment, vkCommentId: 2 },
      ];
      const result = await service.saveComments(comments, {
        source: CommentSource.TASK,
      });
      expect(result).toBe(2);
      expect(prismaMock.comment.upsert).toHaveBeenCalledTimes(2);
    });

    it('передаёт source в create-данных upsert', async () => {
      await service.saveComments([baseComment], {
        source: CommentSource.WATCHLIST,
      });
      const createArg = prismaMock.comment.upsert.mock.calls[0][0] as {
        create: { source: string };
      };
      expect(createArg.create.source).toBe(CommentSource.WATCHLIST);
    });

    it('передаёт watchlistAuthorId в create-данных upsert', async () => {
      await service.saveComments([baseComment], {
        source: CommentSource.WATCHLIST,
        watchlistAuthorId: 77,
      });
      const createArg = prismaMock.comment.upsert.mock.calls[0][0] as {
        create: { watchlistAuthorId: number };
      };
      expect(createArg.create.watchlistAuthorId).toBe(77);
    });

    it('рекурсивно сохраняет thread items', async () => {
      const threadItem: CommentEntity = {
        ...baseComment,
        vkCommentId: 999,
        text: 'вложенный ответ',
      };
      const commentWithThread: CommentEntity = {
        ...baseComment,
        threadItems: [threadItem],
      };

      const result = await service.saveComments([commentWithThread], {
        source: CommentSource.TASK,
      });

      // Родитель + 1 thread item = 2
      expect(result).toBe(2);
      expect(prismaMock.comment.upsert).toHaveBeenCalledTimes(2);
    });

    it('использует переданные keywordMatches без запроса в БД', async () => {
      const keywords = [{ id: 5, normalizedWord: 'ёжик', isPhrase: false }];

      await service.saveComments([baseComment], {
        source: CommentSource.TASK,
        keywordMatches: keywords,
      });

      expect(prismaMock.keyword.findMany).not.toHaveBeenCalled();
    });

    it('загружает keywords из БД если keywordMatches не переданы', async () => {
      prismaMock.keyword.findMany.mockResolvedValue([
        { id: 11, word: 'ёжик', isPhrase: false, keywordForms: [] },
      ]);

      await service.saveComments([baseComment], {
        source: CommentSource.TASK,
      });

      expect(prismaMock.keyword.findMany).toHaveBeenCalledTimes(1);
    });

    it('создаёт CommentKeywordMatch для совпавшего ключевого слова', async () => {
      prismaMock.keyword.findMany.mockResolvedValue([
        { id: 11, word: 'ёжик', isPhrase: false, keywordForms: [] },
      ]);
      prismaMock.commentKeywordMatch.findMany.mockResolvedValue([]);

      await service.saveComments([baseComment], {
        source: CommentSource.TASK,
      });

      expect(prismaMock.commentKeywordMatch.createMany).toHaveBeenCalledWith({
        data: [{ commentId: 99, keywordId: 11, source: MatchSource.COMMENT }],
        skipDuplicates: true,
      });
    });

    it('не создаёт match если текст не содержит ключевых слов', async () => {
      prismaMock.keyword.findMany.mockResolvedValue([
        { id: 11, word: 'несуществующее', isPhrase: false, keywordForms: [] },
      ]);

      await service.saveComments([{ ...baseComment, text: 'обычный текст' }], {
        source: CommentSource.TASK,
      });

      // Если нет совпадений и нет существующих матчей — createMany не вызывается
      expect(prismaMock.commentKeywordMatch.createMany).not.toHaveBeenCalled();
    });

    it('удаляет устаревшие CommentKeywordMatch если текст изменился', async () => {
      prismaMock.keyword.findMany.mockResolvedValue([
        { id: 11, word: 'ёжик', isPhrase: false, keywordForms: [] },
      ]);
      prismaMock.commentKeywordMatch.findMany.mockResolvedValue([
        { keywordId: 11 },
        { keywordId: 99 }, // 99 больше не совпадает
      ]);

      await service.saveComments([{ ...baseComment, text: 'текст с ёжиком' }], {
        source: CommentSource.TASK,
      });

      expect(prismaMock.commentKeywordMatch.deleteMany).toHaveBeenCalled();
    });

    it('индексирует сохранённый комментарий после успешного upsert', async () => {
      await service.saveComments([baseComment], {
        source: CommentSource.TASK,
      });

      expect(searchIndexerMock.indexCommentById).toHaveBeenCalledWith(99);
    });

    it('переиндексирует все комментарии поста после синхронизации post keyword matches', async () => {
      prismaMock.post.findUnique.mockResolvedValue({
        text: 'Ищем подрядчика для ремонта',
      });

      await service.saveComments([baseComment], {
        source: CommentSource.TASK,
      });

      expect(searchIndexerMock.indexCommentsByPost).toHaveBeenCalledWith(
        -100,
        10,
      );
    });

    it('создаёт match по словоформе из KeywordForm даже если base word не совпал', async () => {
      prismaMock.keyword.findMany.mockResolvedValue([
        {
          id: 11,
          word: 'ёж',
          isPhrase: false,
          keywordForms: [{ form: 'ёжиком' }],
        },
      ]);
      prismaMock.commentKeywordMatch.findMany.mockResolvedValue([]);

      await service.saveComments([baseComment], {
        source: CommentSource.TASK,
      });

      expect(prismaMock.commentKeywordMatch.createMany).toHaveBeenCalledWith({
        data: [{ commentId: 99, keywordId: 11, source: MatchSource.COMMENT }],
        skipDuplicates: true,
      });
    });
  });
});
