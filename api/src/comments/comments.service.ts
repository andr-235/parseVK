import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type { CommentWithAuthorDto } from './dto/comment-with-author.dto';
import type { CommentsListDto } from './dto/comments-list.dto';

interface CommentsQueryOptions {
  offset: number;
  limit: number;
}

const authorSelect = {
  vkUserId: true,
  firstName: true,
  lastName: true,
  photo50: true,
  photo100: true,
  photo200Orig: true,
} satisfies Prisma.AuthorSelect;

type CommentWithOptionalAuthor = Prisma.CommentGetPayload<{
  include: {
    author: {
      select: typeof authorSelect;
    };
  };
}>;

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapComment(comment: CommentWithOptionalAuthor): CommentWithAuthorDto {
    const { author, ...commentData } = comment;

    return {
      ...commentData,
      author: author
        ? {
            vkUserId: author.vkUserId,
            firstName: author.firstName,
            lastName: author.lastName,
            logo: author.photo200Orig ?? author.photo100 ?? author.photo50 ?? null,
          }
        : null,
    };
  }

  async getComments({ offset, limit }: CommentsQueryOptions): Promise<CommentsListDto> {
    const [comments, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        skip: offset,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: {
            select: authorSelect,
          },
        },
      }),
      this.prisma.comment.count(),
    ]);

    const items = comments.map((comment) => this.mapComment(comment));

    return {
      items,
      total,
      hasMore: offset + items.length < total,
    };
  }

  async setReadStatus(id: number, isRead: boolean): Promise<CommentWithAuthorDto> {
    const comment = await this.prisma.comment.update({
      where: { id },
      data: { isRead },
      include: {
        author: {
          select: authorSelect,
        },
      },
    });

    return this.mapComment(comment);
  }
}
