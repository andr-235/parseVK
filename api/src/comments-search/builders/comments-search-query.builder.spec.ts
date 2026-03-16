import { describe, expect, it } from 'vitest';
import { CommentsSearchQueryBuilder } from './comments-search-query.builder.js';

describe('CommentsSearchQueryBuilder', () => {
  it('builds boosted multi-match query with keyword and read filters', () => {
    const builder = new CommentsSearchQueryBuilder();

    const query = builder.build({
      query: 'ремонт кухни',
      viewMode: 'comments',
      page: 2,
      pageSize: 10,
      keywords: ['ремонт'],
      readStatus: 'unread',
    });

    expect(query).toMatchObject({
      from: 10,
      size: 10,
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: 'ремонт кухни',
                fields: ['commentText^4', 'postText^1.5'],
              },
            },
          ],
          filter: [
            {
              terms: {
                keywordWords: ['ремонт'],
              },
            },
            {
              term: {
                isRead: false,
              },
            },
          ],
        },
      },
    });
  });
});
