import type { CommentsSearchRequestDto } from '../dto/comments-search-request.dto.js';

export class CommentsSearchQueryBuilder {
  build(payload: CommentsSearchRequestDto) {
    const filters: Array<Record<string, unknown>> = [];

    if (payload.keywords?.length) {
      filters.push({
        terms: {
          keywordWords: payload.keywords,
        },
      });
    }

    if (payload.readStatus === 'read') {
      filters.push({
        term: {
          isRead: true,
        },
      });
    }

    if (payload.readStatus === 'unread') {
      filters.push({
        term: {
          isRead: false,
        },
      });
    }

    return {
      from: ((payload.page ?? 1) - 1) * (payload.pageSize ?? 20),
      size: payload.pageSize ?? 20,
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: payload.query,
                fields: ['commentText^4', 'postText^1.5'],
                fuzziness: 'AUTO',
                operator: 'and',
              },
            },
          ],
          filter: filters,
        },
      },
      highlight: {
        fields: {
          commentText: {},
          postText: {},
        },
      },
      sort: [{ _score: 'desc' }, { publishedAt: 'desc' }],
    };
  }
}
