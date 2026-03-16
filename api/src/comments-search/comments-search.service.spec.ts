import { describe, expect, it } from 'vitest';
import { CommentsSearchService } from './comments-search.service.js';
import { CommentsSearchQueryBuilder } from './builders/comments-search-query.builder.js';
import { CommentsSearchResponseMapper } from './mappers/comments-search-response.mapper.js';

describe('CommentsSearchService', () => {
  it('returns controlled fallback response when elasticsearch search is disabled', async () => {
    const service = new CommentsSearchService(
      { enabled: false, node: '', indexName: 'vk-comments' },
      {
        search: () =>
          Promise.resolve({ hits: { total: { value: 0 }, hits: [] } }),
      },
      new CommentsSearchQueryBuilder(),
      new CommentsSearchResponseMapper(),
    );

    const result = await service.search({
      query: 'ремонт квартиры',
      viewMode: 'comments',
      page: 1,
      pageSize: 20,
      keywords: [],
      readStatus: 'all',
    });

    expect(result).toEqual({
      source: 'fallback',
      viewMode: 'comments',
      total: 0,
      page: 1,
      pageSize: 20,
      items: [],
    });
  });

  it('builds elasticsearch query and maps empty response when search is enabled', async () => {
    const calls: unknown[] = [];
    const service = new CommentsSearchService(
      {
        enabled: true,
        node: 'http://localhost:9200',
        indexName: 'vk-comments',
      },
      {
        search: (payload: unknown) => {
          calls.push(payload);
          return Promise.resolve({
            hits: {
              total: { value: 1 },
              hits: [
                {
                  _source: {
                    commentId: 101,
                    postId: 55,
                    commentText: 'Нужен ремонт квартиры',
                    postText: 'Ищем подрядчика',
                  },
                  highlight: {
                    commentText: ['Нужен <em>ремонт</em> квартиры'],
                  },
                },
              ],
            },
          });
        },
      },
      new CommentsSearchQueryBuilder(),
      new CommentsSearchResponseMapper(),
    );

    const result = await service.search({
      query: 'ремонт квартиры',
      viewMode: 'comments',
      page: 1,
      pageSize: 20,
      keywords: ['ремонт'],
      readStatus: 'read',
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: 'ремонт квартиры',
              },
            },
          ],
        },
      },
    });
    expect(result).toEqual({
      source: 'elasticsearch',
      viewMode: 'comments',
      total: 1,
      page: 1,
      pageSize: 20,
      items: [
        {
          type: 'comment',
          commentId: 101,
          postId: 55,
          commentText: 'Нужен ремонт квартиры',
          postText: 'Ищем подрядчика',
          highlight: ['Нужен <em>ремонт</em> квартиры'],
        },
      ],
    });
  });
});
