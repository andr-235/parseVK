import type { Comment } from '../../generated/prisma/client.js';

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

export interface CommentWithAuthorDto extends Comment {
  author: CommentAuthorDto | null;
  isWatchlisted: boolean;
  matchedKeywords: CommentMatchedKeywordDto[];
  postText: string | null;
  postAttachments: unknown;
  postGroup: PostGroupDto | null;
}
