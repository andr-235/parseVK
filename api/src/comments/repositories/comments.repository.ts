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
  isPhrase: true,
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
  post: {
    select: {
      text: true,
      attachments: true,
      group: {
        select: {
          id: true,
          vkId: true,
          name: true,
          screenName: true,
          photo100: true,
          photo200: true,
        },
      },
    },
  },
} satisfies Prisma.CommentInclude;

@Injectable()
export class CommentsRepository implements ICommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: FindCommentsParams): Promise<CommentWithRelations[]> {
    return this.prisma.comment.findMany({
      where: params.where as Prisma.CommentWhereInput,
      skip: params.skip,
      take: params.take,
      orderBy: params.orderBy as Prisma.CommentOrderByWithRelationInput,
      include: commentInclude,
    });
  }

  async count(params: CountCommentsParams): Promise<number> {
    return this.prisma.comment.count({
      where: params.where as Prisma.CommentWhereInput,
    });
  }

  async update(params: UpdateCommentParams): Promise<CommentWithRelations> {
    return this.prisma.comment.update({
      where: params.where,
      data: params.data,
      include: commentInclude,
    });
  }

  async transaction<T>(queries: Prisma.PrismaPromise<T>[]): Promise<T[]> {
    return this.prisma.$transaction(queries);
  }
}
