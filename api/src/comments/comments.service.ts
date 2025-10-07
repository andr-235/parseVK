import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { CommentWithAuthorDto } from './dto/comment-with-author.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllComments(): Promise<CommentWithAuthorDto[]> {
    const comments = await this.prisma.comment.findMany({
      orderBy: { publishedAt: 'desc' },
      include: {
        author: {
          select: {
            vkUserId: true,
            firstName: true,
            lastName: true,
            photo50: true,
            photo100: true,
            photo200Orig: true,
          },
        },
      },
    });

    return comments.map<CommentWithAuthorDto>(({ author, ...comment }) => ({
      ...comment,
      author: author
        ? {
            vkUserId: author.vkUserId,
            firstName: author.firstName,
            lastName: author.lastName,
            logo: author.photo200Orig ?? author.photo100 ?? author.photo50 ?? null,
          }
        : null,
    }));
  }
}
