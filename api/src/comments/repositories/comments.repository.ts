import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import type {
  ICommentsRepository,
  CommentWithRelations,
  FindCommentsParams,
  CountCommentsParams,
  UpdateCommentParams,
} from '../interfaces/comments-repository.interface';

const authorSelect = {
  vkUserId: true,
  firstName: true,
  lastName: true,
  photo50: true,
  photo100: true,
  photo200Orig: true,
} satisfies Prisma.AuthorSelect;

const keywordSelect = {
  id: true,
  word: true,
  category: true,
} satisfies Prisma.KeywordSelect;

const commentInclude = {
  author: {
    select: authorSelect,
  },
  commentKeywordMatches: {
    include: {
      keyword: {
        select: keywordSelect,
      },
    },
  },
} satisfies Prisma.CommentInclude;

@Injectable()
export class CommentsRepository implements ICommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: FindCommentsParams): Promise<CommentWithRelations[]> {
    return this.prisma.comment.findMany({
      ...params,
      include: commentInclude,
    }) as Promise<CommentWithRelations[]>;
  }

  async count(params: CountCommentsParams): Promise<number> {
    return this.prisma.comment.count(params);
  }

  async update(params: UpdateCommentParams): Promise<CommentWithRelations> {
    return this.prisma.comment.update({
      ...params,
      include: commentInclude,
    }) as Promise<CommentWithRelations>;
  }

  async transaction<T>(queries: Promise<T>[]): Promise<T[]> {
    return this.prisma.$transaction(queries);
  }
}

