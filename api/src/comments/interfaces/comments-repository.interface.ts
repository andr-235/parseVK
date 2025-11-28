import type { CommentWithAuthorDto } from '../dto/comment-with-author.dto';
import type { Prisma } from '@prisma/client';

export type CommentWithRelations = Prisma.CommentGetPayload<{
  include: {
    author: {
      select: {
        vkUserId: true;
        firstName: true;
        lastName: true;
        photo50: true;
        photo100: true;
        photo200Orig: true;
      };
    };
    commentKeywordMatches: {
      include: {
        keyword: {
          select: {
            id: true;
            word: true;
            category: true;
          };
        };
      };
    };
    post: {
      select: {
        text: true;
        attachments: true;
        group: {
          select: {
            id: true;
            vkId: true;
            name: true;
            screenName: true;
            photo100: true;
            photo200: true;
          };
        };
      };
    };
  };
}>;

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
  transaction<T>(queries: any[]): Promise<T[]>;
}

