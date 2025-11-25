import type { CommentWithAuthorDto } from '../dto/comment-with-author.dto';

export interface CommentWithRelations {
  id: number;
  text: string;
  publishedAt: Date;
  isRead: boolean;
  watchlistAuthorId: number | null;
  author: {
    vkUserId: number;
    firstName: string;
    lastName: string;
    photo50: string | null;
    photo100: string | null;
    photo200Orig: string | null;
  } | null;
  commentKeywordMatches: Array<{
    keyword: {
      id: number;
      word: string;
      category: string | null;
    };
  }>;
}

export interface FindCommentsParams {
  where: unknown;
  skip?: number;
  take?: number;
  orderBy?: unknown;
}

export interface CountCommentsParams {
  where: unknown;
}

export interface UpdateCommentParams {
  where: { id: number };
  data: { isRead: boolean };
}

export interface ICommentsRepository {
  findMany(params: FindCommentsParams): Promise<CommentWithRelations[]>;
  count(params: CountCommentsParams): Promise<number>;
  update(params: UpdateCommentParams): Promise<CommentWithRelations>;
  transaction<T>(queries: Promise<T>[]): Promise<T[]>;
}

