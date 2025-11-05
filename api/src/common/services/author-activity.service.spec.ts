import { CommentSource } from '@prisma/client'
import { AuthorActivityService } from './author-activity.service'
import type { PrismaService } from '../../prisma.service'
import type { CommentEntity } from '../types/comment-entity.type'
import type { VkService } from '../../vk/vk.service'

describe('AuthorActivityService - keyword matches', () => {
  let service: AuthorActivityService
  let prismaMock: {
    comment: { upsert: jest.Mock }
    keyword: { findMany: jest.Mock }
    commentKeywordMatch: {
      findMany: jest.Mock
      deleteMany: jest.Mock
      createMany: jest.Mock
    }
    $transaction: jest.Mock
  }

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
  }

  beforeEach(() => {
    prismaMock = {
      comment: {
        upsert: jest.fn().mockResolvedValue({ id: 42 }),
      },
      keyword: {
        findMany: jest.fn().mockResolvedValue([
          { id: 11, word: 'ёжик' },
          { id: 12, word: 'alert' },
        ]),
      },
      commentKeywordMatch: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest
        .fn()
        .mockImplementation(async (operations: Array<Promise<unknown>>) =>
          Promise.all(operations),
        ),
    }

    service = new AuthorActivityService(
      prismaMock as unknown as PrismaService,
      {} as VkService,
    )
  })

  it('создаёт совпадения по ключевым словам после обновления комментария', async () => {
    await service.saveComments([baseComment], { source: CommentSource.TASK })

    expect(prismaMock.keyword.findMany).toHaveBeenCalledTimes(1)
    expect(prismaMock.commentKeywordMatch.findMany).toHaveBeenCalledWith({
      where: { commentId: 42 },
      select: { keywordId: true },
    })
    expect(prismaMock.commentKeywordMatch.createMany).toHaveBeenCalledWith({
      data: [{ commentId: 42, keywordId: 11 }],
      skipDuplicates: true,
    })
    expect(prismaMock.commentKeywordMatch.deleteMany).not.toHaveBeenCalled()
  })

  it('удаляет устаревшие совпадения, если текст больше не содержит ключевых слов', async () => {
    prismaMock.commentKeywordMatch.findMany.mockResolvedValueOnce([
      { keywordId: 11 },
    ])

    const updatedComment: CommentEntity = {
      ...baseComment,
      text: 'Без совпадений по ключевым словам',
    }

    await service.saveComments([updatedComment], { source: CommentSource.TASK })

    expect(prismaMock.commentKeywordMatch.deleteMany).toHaveBeenCalledWith({
      where: {
        commentId: 42,
        keywordId: { in: [11] },
      },
    })
    expect(prismaMock.commentKeywordMatch.createMany).not.toHaveBeenCalled()
  })
})
