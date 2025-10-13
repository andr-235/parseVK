import type { Comment } from '@prisma/client';

export interface CommentAuthorDto {
  vkUserId: number;
  firstName: string;
  lastName: string;
  logo: string | null;
}

export type CommentWithAuthorDto = Comment & {
  author: CommentAuthorDto | null;
  isWatchlisted: boolean;
};
