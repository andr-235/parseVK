import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type { CommentWithAuthorDto } from './dto/comment-with-author.dto';

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

  async getAllComments(): Promise<CommentWithAuthorDto[]> {
    const comments = await this.prisma.comment.findMany({
      orderBy: { publishedAt: 'desc' },
      include: {
        author: {
          select: authorSelect,
        },
      },
    });

    return comments.map((comment) => this.mapComment(comment));
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
