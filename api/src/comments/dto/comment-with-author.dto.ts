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
  source?: 'COMMENT' | 'POST';
}

export interface PostGroupDto {
  id: number;
  vkId: number;
  name: string;
  screenName: string | null;
  photo: string | null;
}

export type CommentWithAuthorDto = Comment & {
  author: CommentAuthorDto | null;
  isWatchlisted: boolean;
  matchedKeywords: CommentMatchedKeywordDto[];
  postText: string | null;
  postAttachments: unknown;
  postGroup: PostGroupDto | null;
};
