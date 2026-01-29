import { CommentsFilterBuilder } from './comments-filter.builder.js';
import type { Prisma } from '../../generated/prisma/client.js';

describe('CommentsFilterBuilder', () => {
  let builder: CommentsFilterBuilder;

  beforeEach(() => {
    builder = new CommentsFilterBuilder();
  });

  describe('buildBaseWhere', () => {
    it('должен возвращать пустой объект если фильтры отсутствуют', () => {
      const result = builder.buildBaseWhere({});

      expect(result).toEqual({});
    });

    it('должен строить фильтр по ключевым словам', () => {
      const result = builder.buildBaseWhere({
        keywords: ['test', 'demo'],
      });

      expect(result).toEqual({
        commentKeywordMatches: {
          some: {
            keyword: {
              word: { in: ['test', 'demo'] },
            },
          },
        },
      });
    });

    it('должен нормализовать ключевые слова (trim, lowercase, unique)', () => {
      const result = builder.buildBaseWhere({
        keywords: ['  TEST  ', 'test', 'Demo', '  '],
      });

      expect(result).toEqual({
        commentKeywordMatches: {
          some: {
            keyword: {
              word: { in: ['test', 'demo'] },
            },
          },
        },
      });
    });

    it('должен строить фильтр по поисковому запросу', () => {
      const result = builder.buildBaseWhere({
        search: 'test query',
      });

      expect(result).toEqual({
        OR: [
          {
            text: {
              contains: 'test query',
              mode: 'insensitive',
            },
          },
          {
            post: {
              text: {
                contains: 'test query',
                mode: 'insensitive',
              },
            },
          },
        ],
      });
    });

    it('должен объединять фильтры по ключевым словам и поиску', () => {
      const result = builder.buildBaseWhere({
        keywords: ['test'],
        search: 'query',
      });

      expect(result).toEqual({
        AND: [
          {
            commentKeywordMatches: {
              some: {
                keyword: {
                  word: { in: ['test'] },
                },
              },
            },
          },
          {
            OR: [
              {
                text: {
                  contains: 'query',
                  mode: 'insensitive',
                },
              },
              {
                post: {
                  text: {
                    contains: 'query',
                    mode: 'insensitive',
                  },
                },
              },
            ],
          },
        ],
      });
    });

    it('должен игнорировать пустые ключевые слова', () => {
      const result = builder.buildBaseWhere({
        keywords: ['  ', '', 'test'],
      });

      expect(result).toEqual({
        commentKeywordMatches: {
          some: {
            keyword: {
              word: { in: ['test'] },
            },
          },
        },
      });
    });
  });

  describe('buildReadStatusWhere', () => {
    it('должен возвращать пустой объект для "all"', () => {
      const result = builder.buildReadStatusWhere('all');

      expect(result).toEqual({});
    });

    it('должен строить фильтр для "read"', () => {
      const result = builder.buildReadStatusWhere('read');

      expect(result).toEqual({ isRead: true });
    });

    it('должен строить фильтр для "unread"', () => {
      const result = builder.buildReadStatusWhere('unread');

      expect(result).toEqual({ isRead: false });
    });

    it('должен возвращать пустой объект для undefined', () => {
      const result = builder.buildReadStatusWhere(undefined);

      expect(result).toEqual({});
    });
  });

  describe('mergeWhere', () => {
    it('должен возвращать пустой объект если все where пустые', () => {
      const result = builder.mergeWhere({}, undefined, {});

      expect(result).toEqual({});
    });

    it('должен возвращать единственный where если он один', () => {
      const where1: Prisma.CommentWhereInput = { isRead: true };
      const result = builder.mergeWhere(where1);

      expect(result).toBe(where1);
    });

    it('должен объединять несколько where через AND', () => {
      const where1: Prisma.CommentWhereInput = { isRead: true };
      const where2: Prisma.CommentWhereInput = {
        text: { contains: 'test' },
      };

      const result = builder.mergeWhere(where1, where2);

      expect(result).toEqual({
        AND: [where1, where2],
      });
    });

    it('должен игнорировать пустые и undefined where', () => {
      const where1: Prisma.CommentWhereInput = { isRead: true };
      const where2: Prisma.CommentWhereInput = {};

      const result = builder.mergeWhere(where1, where2, undefined, {});

      expect(result).toBe(where1);
    });
  });

  describe('buildWhere', () => {
    it('должен объединять базовые фильтры и статус прочтения', () => {
      const result = builder.buildWhere({
        keywords: ['test'],
        readStatus: 'read',
      });

      expect(result).toEqual({
        AND: [
          {
            commentKeywordMatches: {
              some: {
                keyword: {
                  word: { in: ['test'] },
                },
              },
            },
          },
          { isRead: true },
        ],
      });
    });

    it('должен возвращать только базовые фильтры если readStatus не указан', () => {
      const result = builder.buildWhere({
        search: 'query',
      });

      expect(result).toEqual({
        OR: [
          {
            text: {
              contains: 'query',
              mode: 'insensitive',
            },
          },
          {
            post: {
              text: {
                contains: 'query',
                mode: 'insensitive',
              },
            },
          },
        ],
      });
    });
  });
});
