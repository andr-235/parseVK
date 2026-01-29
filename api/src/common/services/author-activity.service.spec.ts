import { vi } from 'vitest';
import { CommentSource } from '../types/comment-source.enum.js';
import { MatchSource } from '../types/match-source.enum.js';
import { AuthorActivityService } from './author-activity.service.js';
import type { PrismaService } from '../../prisma.service.js';
import type { CommentEntity } from '../types/comment-entity.type.js';
import type { VkService } from '../../vk/vk.service.js';

describe('AuthorActivityService - keyword matches', () => {
  let service: AuthorActivityService;
  let prismaMock: {
    comment: { upsert: vi.Mock<Promise<{ id: number }>> };
    post: {
      findUnique: vi.Mock<
        Promise<{ id: number; ownerId: number; postId: number } | null>
      >;
    };
    keyword: {
      findMany: vi.Mock<Promise<Array<{ id: number; word: string }>>>;
    };
    commentKeywordMatch: {
      findMany: vi.Mock<Promise<Array<{ keywordId: number }>>>;
      deleteMany: vi.Mock<Promise<{ count: number }>>;
      createMany: vi.Mock<Promise<{ count: number }>>;
    };
    $transaction: vi.Mock<Promise<unknown>, [unknown]>;
  };

  const baseComment: CommentEntity = {
    postId: 1,
    ownerId: 1,
    vkCommentId: 101,
    fromId: 5,
    text: 'Это Ёжик и тестовый пример',
    publishedAt: new Date('2024-01-01T00:00:00.000Z'),
    likesCount: null,
    parentsStack: null,
    threadCount: null,
    threadItems: null,
    attachments: null,
    replyToUser: null,
    replyToComment: null,
    isDeleted: false,
  };

  beforeEach(() => {
    prismaMock = {
      comment: {
        upsert: vi
          .fn<Promise<{ id: number }>, [unknown]>()
          .mockResolvedValue({ id: 42 }),
      },
      post: {
        findUnique: vi
          .fn<
            Promise<{ id: number; ownerId: number; postId: number } | null>,
            [unknown]
          >()
          .mockResolvedValue({ id: 1, ownerId: 1, postId: 1 }),
      },
      keyword: {
        findMany: vi
          .fn<Promise<Array<{ id: number; word: string }>>, [unknown]>()
          .mockResolvedValue([
            { id: 11, word: 'ёжик' },
            { id: 12, word: 'alert' },
          ]),
      },
      commentKeywordMatch: {
        findMany: vi
          .fn<Promise<Array<{ keywordId: number }>>, [unknown]>()
          .mockResolvedValue([]),
        deleteMany: vi
          .fn<Promise<{ count: number }>, [unknown]>()
          .mockResolvedValue({ count: 0 }),
        createMany: vi
          .fn<Promise<{ count: number }>, [unknown]>()
          .mockResolvedValue({ count: 0 }),
      },
      $transaction: vi
        .fn<Promise<unknown>, [unknown]>()
        .mockImplementation(async (arg: unknown) => {
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

    service = new AuthorActivityService(
      prismaMock as unknown as PrismaService,
      {} as VkService,
    );
  });

  it('создаёт совпадения по ключевым словам после обновления комментария', async () => {
    await service.saveComments([baseComment], { source: CommentSource.TASK });

    expect(prismaMock.keyword.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.commentKeywordMatch.findMany).toHaveBeenCalledWith({
      where: { commentId: 42, source: MatchSource.COMMENT },
      select: { keywordId: true },
    });
    expect(prismaMock.commentKeywordMatch.createMany).toHaveBeenCalledWith({
      data: [{ commentId: 42, keywordId: 11, source: MatchSource.COMMENT }],
      skipDuplicates: true,
    });
    expect(prismaMock.commentKeywordMatch.deleteMany).not.toHaveBeenCalled();
  });

  it('удаляет устаревшие совпадения, если текст больше не содержит ключевых слов', async () => {
    prismaMock.commentKeywordMatch.findMany.mockResolvedValueOnce([
      { keywordId: 11 },
    ]);

    const updatedComment: CommentEntity = {
      ...baseComment,
      text: 'Без совпадений по ключевым словам',
    };

    await service.saveComments([updatedComment], {
      source: CommentSource.TASK,
    });

    expect(prismaMock.commentKeywordMatch.deleteMany).toHaveBeenCalledWith({
      where: {
        commentId: 42,
        keywordId: { in: [11] },
        source: MatchSource.COMMENT,
      },
    });
    expect(prismaMock.commentKeywordMatch.createMany).not.toHaveBeenCalled();
  });
});
