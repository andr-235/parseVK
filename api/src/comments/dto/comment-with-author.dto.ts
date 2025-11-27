import type { Comment } from '@prisma/client';

export interface CommentAuthorDto {
  vkUserId: number;
  firstName: string;
  lastName: string;
  logo: string | null;
}

export interface CommentMatchedKeywordDto {
  id: number;
  word: string;
  category: string | null;
}

export type CommentWithAuthorDto = Comment & {
  author: CommentAuthorDto | null;
  isWatchlisted: boolean;
  matchedKeywords: CommentMatchedKeywordDto[];
  postText: string | null;
};
