import { describe, expect, it, vi } from 'vitest';
import { CommentsSearchIndexerService } from './comments-search-indexer.service.js';
import type { PrismaService } from '../../prisma.service.js';
import type { CommentsSearchClient } from '../comments-search.client.js';
import { CommentsSearchDocumentMapper } from '../mappers/comments-search-document.mapper.js';

describe('CommentsSearchIndexerService', () => {
  it('loads comment with context and indexes mapped document', async () => {
    const prismaMock = {
      comment: {
        findUnique: vi.fn().mockResolvedValue({
          id: 101,
          postId: 10,
          ownerId: -100,
          vkCommentId: 501,
          authorVkId: 42,
          text: 'Нужен ремонт квартиры',
          publishedAt: new Date('2024-06-01T12:00:00.000Z'),
          source: 'TASK',
          isRead: false,
          author: {
            firstName: 'Иван',
            lastName: 'Иванов',
          },
          post: {
            text: 'Ищем подрядчика для ремонта',
            group: {
              vkId: 777,
              name: 'Тестовая группа',
            },
          },
          commentKeywordMatches: [
            {
              keyword: {
                id: 5,
                word: 'ремонт',
              },
            },
          ],
        }),
      },
    };
    const clientMock = {
      indexDocument: vi.fn().mockResolvedValue(undefined),
    };
    const service = new CommentsSearchIndexerService(
      { enabled: true, node: 'http://localhost:9200', indexName: 'vk-comments' },
      prismaMock as unknown as PrismaService,
      clientMock as unknown as CommentsSearchClient,
      new CommentsSearchDocumentMapper(),
    );

    await service.indexCommentById(101);

    expect(prismaMock.comment.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 101 },
      }),
    );
    expect(clientMock.indexDocument).toHaveBeenCalledWith(
      '101',
      expect.objectContaining({
        commentId: 101,
        postId: 10,
        groupId: 777,
        authorVkId: 42,
        commentText: 'Нужен ремонт квартиры',
        postText: 'Ищем подрядчика для ремонта',
        keywordWords: ['ремонт'],
      }),
    );
  });
});
