import { Injectable } from '@nestjs/common';
import type { CommentSource } from '@prisma/client';
import type { WatchlistAuthorWithRelations } from '../interfaces/watchlist-repository.interface';
import type {
  WatchlistAuthorCardDto,
  WatchlistAuthorProfileDto,
  WatchlistCommentDto,
} from '../dto/watchlist-author.dto';
import type { PhotoAnalysisSummaryDto } from '../../photo-analysis/dto/photo-analysis-response.dto';

@Injectable()
export class WatchlistAuthorMapper {
  mapAuthor(
    record: WatchlistAuthorWithRelations,
    commentsCount: number,
    summary: PhotoAnalysisSummaryDto,
  ): WatchlistAuthorCardDto {
    const profile = this.mapProfile(record);

    return {
      id: record.id,
      authorVkId: record.authorVkId,
      status: record.status,
      lastCheckedAt: record.lastCheckedAt
        ? record.lastCheckedAt.toISOString()
        : null,
      lastActivityAt: record.lastActivityAt
        ? record.lastActivityAt.toISOString()
        : null,
      foundCommentsCount: record.foundCommentsCount,
      totalComments: commentsCount,
      monitoringStartedAt: record.monitoringStartedAt.toISOString(),
      monitoringStoppedAt: record.monitoringStoppedAt
        ? record.monitoringStoppedAt.toISOString()
        : null,
      settingsId: record.settingsId,
      author: profile,
      analysisSummary: summary,
    };
  }

  mapProfile(record: WatchlistAuthorWithRelations): WatchlistAuthorProfileDto {
    const author = record.author;

    const firstName = author?.firstName ?? '';
    const lastName = author?.lastName ?? '';
    const fullName =
      [firstName, lastName].filter(Boolean).join(' ').trim() ||
      `id${record.authorVkId}`;
    const avatar =
      author?.photo200Orig ?? author?.photo100 ?? author?.photo50 ?? null;
    const screenName = author?.screenName ?? null;
    const domain = author?.domain ?? null;

    const profileUrl = screenName
      ? `https://vk.com/${screenName}`
      : domain
        ? `https://vk.com/${domain}`
        : `https://vk.com/id${record.authorVkId}`;

    return {
      vkUserId: record.authorVkId,
      firstName,
      lastName,
      fullName,
      avatar,
      screenName,
      domain,
      profileUrl,
    };
  }

  mapComment(comment: {
    id: number;
    ownerId: number;
    postId: number;
    vkCommentId: number;
    text: string | null;
    publishedAt: Date | null;
    createdAt: Date;
    source: string;
  }): WatchlistCommentDto {
    return {
      id: comment.id,
      ownerId: comment.ownerId,
      postId: comment.postId,
      vkCommentId: comment.vkCommentId,
      text: comment.text,
      publishedAt: comment.publishedAt?.toISOString() ?? null,
      createdAt: comment.createdAt.toISOString(),
      source: comment.source as CommentSource,
      commentUrl: this.buildCommentUrl(
        comment.ownerId,
        comment.postId,
        comment.vkCommentId,
      ),
    };
  }

  buildCommentUrl(
    ownerId: number,
    postId: number,
    vkCommentId: number | null,
  ): string | null {
    if (!ownerId || !postId) {
      return null;
    }

    const baseUrl = `https://vk.com/wall${ownerId}_${postId}`;

    if (!vkCommentId) {
      return baseUrl;
    }

    return `${baseUrl}?reply=${vkCommentId}`;
  }
}
