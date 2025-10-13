import type { CommentSource, WatchlistStatus } from '@prisma/client';

export interface WatchlistAuthorProfileDto {
  vkUserId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar: string | null;
  screenName: string | null;
  domain: string | null;
  profileUrl: string | null;
}

export interface WatchlistAuthorCardDto {
  id: number;
  authorVkId: number;
  status: WatchlistStatus;
  lastCheckedAt: string | null;
  lastActivityAt: string | null;
  foundCommentsCount: number;
  totalComments: number;
  monitoringStartedAt: string;
  monitoringStoppedAt: string | null;
  settingsId: number;
  author: WatchlistAuthorProfileDto;
}

export interface WatchlistAuthorListDto {
  items: WatchlistAuthorCardDto[];
  total: number;
  hasMore: boolean;
}

export interface WatchlistCommentDto {
  id: number;
  ownerId: number;
  postId: number;
  vkCommentId: number;
  text: string | null;
  publishedAt: string | null;
  createdAt: string;
  source: CommentSource;
  commentUrl: string | null;
}

export interface WatchlistCommentsListDto {
  items: WatchlistCommentDto[];
  total: number;
  hasMore: boolean;
}

export interface WatchlistAuthorDetailsDto extends WatchlistAuthorCardDto {
  comments: WatchlistCommentsListDto;
}

export interface WatchlistSettingsDto {
  id: number;
  trackAllComments: boolean;
  pollIntervalMinutes: number;
  maxAuthors: number;
  createdAt: string;
  updatedAt: string;
}
