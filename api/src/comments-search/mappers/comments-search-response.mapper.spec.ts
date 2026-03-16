import { describe, expect, it } from 'vitest';
import { CommentsSearchResponseMapper } from './comments-search-response.mapper.js';

describe('CommentsSearchResponseMapper', () => {
  const mapper = new CommentsSearchResponseMapper();

  it('maps comment hits with highlights', () => {
    const result = mapper.map({
      payload: {
        query: 'ремонт квартиры',
        viewMode: 'comments',
        page: 1,
        pageSize: 20,
      },
      response: {
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

  it('groups comment hits by post in posts mode', () => {
    const result = mapper.map({
      payload: {
        query: 'ремонт квартиры',
        viewMode: 'posts',
        page: 1,
        pageSize: 20,
      },
      response: {
        hits: {
          total: { value: 2 },
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
            {
              _source: {
                commentId: 102,
                postId: 55,
                commentText: 'Есть бригада',
                postText: 'Ищем подрядчика',
              },
              highlight: {
                postText: ['<em>Ищем</em> подрядчика'],
              },
            },
          ],
        },
      },
    });

    expect(result).toEqual({
      source: 'elasticsearch',
      viewMode: 'posts',
      total: 2,
      page: 1,
      pageSize: 20,
      items: [
        {
          type: 'post',
          postId: 55,
          postText: 'Ищем подрядчика',
          comments: [
            {
              type: 'comment',
              commentId: 101,
              postId: 55,
              commentText: 'Нужен ремонт квартиры',
              postText: 'Ищем подрядчика',
              highlight: ['Нужен <em>ремонт</em> квартиры'],
            },
            {
              type: 'comment',
              commentId: 102,
              postId: 55,
              commentText: 'Есть бригада',
              postText: 'Ищем подрядчика',
              highlight: ['<em>Ищем</em> подрядчика'],
            },
          ],
        },
      ],
    });
  });
});
