import type {
  IWatchlistAuthorDetailsResponse,
  IWatchlistAuthorResponse,
  IWatchlistCommentResponse,
  IWatchlistSettingsResponse,
} from '@/types/api'
import type {
  PhotoAnalysisSummary,
  WatchlistAuthorCard,
  WatchlistAuthorDetails,
  WatchlistComment,
  WatchlistSettings,
} from '@/types'
import { createEmptyPhotoAnalysisSummary } from '@/types'

export const WATCHLIST_PAGE_SIZE = 20

const cloneSummary = (summary: PhotoAnalysisSummary): PhotoAnalysisSummary => ({
  total: summary.total,
  suspicious: summary.suspicious,
  lastAnalyzedAt: summary.lastAnalyzedAt,
  categories: summary.categories.map((item) => ({ ...item })),
  levels: summary.levels.map((item) => ({ ...item })),
})

export const mapWatchlistAuthor = (author: IWatchlistAuthorResponse): WatchlistAuthorCard => ({
  id: author.id,
  authorVkId: author.authorVkId,
  status: author.status,
  lastCheckedAt: author.lastCheckedAt,
  lastActivityAt: author.lastActivityAt,
  foundCommentsCount: author.foundCommentsCount,
  totalComments: author.totalComments,
  monitoringStartedAt: author.monitoringStartedAt,
  monitoringStoppedAt: author.monitoringStoppedAt,
  settingsId: author.settingsId,
  author: {
    vkUserId: author.author.vkUserId,
    firstName: author.author.firstName,
    lastName: author.author.lastName,
    fullName: author.author.fullName,
    avatar: author.author.avatar,
    profileUrl: author.author.profileUrl,
    screenName: author.author.screenName,
    domain: author.author.domain,
  },
  analysisSummary: cloneSummary(
    author.analysisSummary ?? createEmptyPhotoAnalysisSummary(),
  ),
})

export const mapWatchlistComment = (comment: IWatchlistCommentResponse): WatchlistComment => ({
  id: comment.id,
  ownerId: comment.ownerId,
  postId: comment.postId,
  vkCommentId: comment.vkCommentId,
  text: comment.text,
  publishedAt: comment.publishedAt,
  createdAt: comment.createdAt,
  source: comment.source,
  commentUrl: comment.commentUrl,
})

export const mapWatchlistDetails = (details: IWatchlistAuthorDetailsResponse): WatchlistAuthorDetails => ({
  ...mapWatchlistAuthor(details),
  comments: {
    items: details.comments.items.map(mapWatchlistComment),
    total: details.comments.total,
    hasMore: details.comments.hasMore,
  },
})

export const mapWatchlistSettings = (settings: IWatchlistSettingsResponse): WatchlistSettings => ({
  id: settings.id,
  trackAllComments: settings.trackAllComments,
  pollIntervalMinutes: settings.pollIntervalMinutes,
  maxAuthors: settings.maxAuthors,
  createdAt: settings.createdAt,
  updatedAt: settings.updatedAt,
})
