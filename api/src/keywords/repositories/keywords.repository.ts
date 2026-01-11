import { Injectable } from '@nestjs/common';
import type { Keyword, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import type { IKeywordsRepository } from '../interfaces/keywords-repository.interface';
import type { MatchSource } from '../../common/types/match-source.enum';

@Injectable()
export class KeywordsRepository implements IKeywordsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUnique(where: { word: string }): Promise<Keyword> {
    return this.prisma.keyword.findUniqueOrThrow({ where });
  }

  findMany(
    where?: Prisma.KeywordWhereInput,
    orderBy?: Prisma.KeywordOrderByWithRelationInput,
    skip?: number,
    take?: number,
  ): Promise<Keyword[]> {
    return this.prisma.keyword.findMany({ where, orderBy, skip, take });
  }

  count(where?: Prisma.KeywordWhereInput): Promise<number> {
    return this.prisma.keyword.count({ where });
  }

  create(data: {
    word: string;
    category: string | null;
    isPhrase: boolean;
  }): Promise<Keyword> {
    return this.prisma.keyword.create({ data });
  }

  update(
    where: { id: number },
    data: {
      category?: string | null;
      isPhrase?: boolean;
    },
  ): Promise<Keyword> {
    return this.prisma.keyword.update({ where, data });
  }

  async delete(where: { id: number }): Promise<void> {
    await this.prisma.keyword.delete({ where });
  }

  deleteMany(): Promise<{ count: number }> {
    return this.prisma.keyword.deleteMany({});
  }

  findManyWithSelect(select: {
    id: true;
    word: true;
    isPhrase: true;
  }): Promise<Array<{ id: number; word: string; isPhrase: boolean }>> {
    return this.prisma.keyword.findMany({ select });
  }

  countComments(): Promise<number> {
    return this.prisma.comment.count();
  }

  countPosts(): Promise<number> {
    return this.prisma.post.count();
  }

  findCommentsBatch(params: {
    skip: number;
    take: number;
  }): Promise<Array<{ id: number; text: string | null }>> {
    return this.prisma.comment.findMany({
      select: { id: true, text: true },
      skip: params.skip,
      take: params.take,
    });
  }

  findPostsBatch(params: { skip: number; take: number }): Promise<
    Array<{
      id: number;
      ownerId: number;
      vkPostId: number;
      text: string | null;
    }>
  > {
    return this.prisma.post.findMany({
      select: { id: true, ownerId: true, vkPostId: true, text: true },
      skip: params.skip,
      take: params.take,
    });
  }

  findCommentsByPost(params: {
    ownerId: number;
    postId: number;
  }): Promise<Array<{ id: number }>> {
    return this.prisma.comment.findMany({
      where: { ownerId: params.ownerId, postId: params.postId },
      select: { id: true },
    });
  }

  findCommentKeywordMatches(params: {
    commentId: number;
    source: MatchSource;
  }): Promise<Array<{ keywordId: number }>> {
    return this.prisma.commentKeywordMatch.findMany({
      where: {
        commentId: params.commentId,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        source: params.source as Prisma.MatchSource,
      },
      select: { keywordId: true },
    });
  }

  findPostKeywordMatches(params: {
    commentIds: number[];
    source: MatchSource;
  }): Promise<Array<{ commentId: number; keywordId: number }>> {
    return this.prisma.commentKeywordMatch.findMany({
      where: {
        commentId: { in: params.commentIds },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        source: params.source as Prisma.MatchSource,
      },
      select: { commentId: true, keywordId: true },
    });
  }

  async deleteCommentKeywordMatches(params: {
    commentId: number;
    source: MatchSource;
    keywordIds?: number[];
  }): Promise<void> {
    await this.prisma.commentKeywordMatch.deleteMany({
      where: {
        commentId: params.commentId,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        source: params.source as Prisma.MatchSource,
        ...(params.keywordIds ? { keywordId: { in: params.keywordIds } } : {}),
      },
    });
  }

  async deletePostKeywordMatches(params: {
    commentId: number;
    keywordId: number;
    source: MatchSource;
  }): Promise<void> {
    await this.prisma.commentKeywordMatch.deleteMany({
      where: {
        commentId: params.commentId,
        keywordId: params.keywordId,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        source: params.source as Prisma.MatchSource,
      },
    });
  }

  async createCommentKeywordMatches(
    data: Array<{
      commentId: number;
      keywordId: number;
      source: MatchSource;
    }>,
  ): Promise<void> {
    await this.prisma.commentKeywordMatch.createMany({
      data: data.map((item) => ({
        ...item,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        source: item.source as Prisma.MatchSource,
      })),
      skipDuplicates: true,
    });
  }
}
