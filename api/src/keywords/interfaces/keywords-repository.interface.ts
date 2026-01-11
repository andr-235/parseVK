import type { Keyword, Prisma } from '@prisma/client';
import type { MatchSource } from '../../common/types/match-source.enum';

export interface IKeywordsRepository {
  findUnique(where: { word: string }): Promise<Keyword>;
  findMany(
    where?: Prisma.KeywordWhereInput,
    orderBy?: Prisma.KeywordOrderByWithRelationInput,
    skip?: number,
    take?: number,
  ): Promise<Keyword[]>;
  count(where?: Prisma.KeywordWhereInput): Promise<number>;
  create(data: {
    word: string;
    category: string | null;
    isPhrase: boolean;
  }): Promise<Keyword>;
  update(
    where: { id: number },
    data: {
      category?: string | null;
      isPhrase?: boolean;
    },
  ): Promise<Keyword>;
  delete(where: { id: number }): Promise<void>;
  deleteMany(): Promise<{ count: number }>;
  findManyWithSelect(select: { id: true; word: true; isPhrase: true }): Promise<
    Array<{
      id: number;
      word: string;
      isPhrase: boolean;
    }>
  >;
  // Methods for keyword matching recalculation
  countComments(): Promise<number>;
  countPosts(): Promise<number>;
  findCommentsBatch(params: { skip: number; take: number }): Promise<
    Array<{
      id: number;
      text: string | null;
    }>
  >;
  findPostsBatch(params: { skip: number; take: number }): Promise<
    Array<{
      id: number;
      ownerId: number;
      vkPostId: number;
      text: string | null;
    }>
  >;
  findCommentsByPost(params: {
    ownerId: number;
    postId: number;
  }): Promise<Array<{ id: number }>>;
  findCommentKeywordMatches(params: {
    commentId: number;
    source: MatchSource;
  }): Promise<Array<{ keywordId: number }>>;
  findPostKeywordMatches(params: {
    commentIds: number[];
    source: MatchSource;
  }): Promise<Array<{ commentId: number; keywordId: number }>>;
  deleteCommentKeywordMatches(params: {
    commentId: number;
    source: MatchSource;
    keywordIds?: number[];
  }): Promise<void>;
  deletePostKeywordMatches(params: {
    commentId: number;
    keywordId: number;
    source: MatchSource;
  }): Promise<void>;
  createCommentKeywordMatches(
    data: Array<{
      commentId: number;
      keywordId: number;
      source: MatchSource;
    }>,
  ): Promise<void>;
}
