import type { PhotoAnalysisSummaryDto } from '../../photo-analysis/dto/photo-analysis-response.dto';
import { AuthorCardDto, AuthorDetailsDto } from '../dto/author.dto';
import { AuthorCountersParser } from '../parsers/author-counters.parser';
import type { AuthorRecord } from '../types/author-record.type';

export class AuthorMapper {
  static toCardDto(
    author: AuthorRecord,
    summary?: PhotoAnalysisSummaryDto,
  ): AuthorCardDto {
    const normalizedSummary = this.cloneSummary(summary);
    const counters = AuthorCountersParser.extractCounters(author.counters);
    const summaryPhotos = Number.isFinite(normalizedSummary.total)
      ? normalizedSummary.total
      : null;
    const photosCount = counters.photos ?? summaryPhotos ?? null;
    const followers = author.followersCount ?? counters.followers ?? null;

    const card = new AuthorCardDto();
    card.id = author.id;
    card.vkUserId = author.vkUserId;
    card.firstName = author.firstName;
    card.lastName = author.lastName;
    card.fullName = `${author.firstName} ${author.lastName}`.trim();
    card.photo50 = author.photo50 ?? null;
    card.photo100 = author.photo100 ?? null;
    card.photo200 = author.photo200Orig ?? null;
    card.domain = author.domain ?? null;
    card.screenName = author.screenName ?? null;
    card.profileUrl = this.buildProfileUrl(author);
    card.city = (author.city as Record<string, unknown>) ?? null;
    card.summary = normalizedSummary;
    card.photosCount = photosCount;
    card.audiosCount = counters.audios;
    card.videosCount = counters.videos;
    card.friendsCount = counters.friends;
    card.followersCount = followers;
    card.lastSeenAt = AuthorCountersParser.extractLastSeenAt(author.lastSeen);
    card.verifiedAt = author.verifiedAt
      ? author.verifiedAt.toISOString()
      : null;
    card.isVerified = Boolean(author.verifiedAt);

    return card;
  }

  static toDetailsDto(
    author: AuthorRecord,
    summary?: PhotoAnalysisSummaryDto,
  ): AuthorDetailsDto {
    const card = this.toCardDto(author, summary);
    const details = new AuthorDetailsDto();
    Object.assign(details, card);
    details.city = (author.city as Record<string, unknown>) ?? null;
    details.country = (author.country as Record<string, unknown>) ?? null;
    details.createdAt = author.createdAt.toISOString();
    details.updatedAt = author.updatedAt.toISOString();
    return details;
  }

  private static buildProfileUrl(author: {
    vkUserId: number;
    domain: string | null;
    screenName: string | null;
  }): string | null {
    if (author.domain) {
      return `https://vk.com/${author.domain}`;
    }

    if (author.screenName) {
      return `https://vk.com/${author.screenName}`;
    }

    return `https://vk.com/id${author.vkUserId}`;
  }

  private static cloneSummary(
    summary?: PhotoAnalysisSummaryDto,
  ): PhotoAnalysisSummaryDto {
    if (!summary) {
      return {
        total: 0,
        suspicious: 0,
        lastAnalyzedAt: null,
        categories: [],
        levels: [],
      };
    }

    return {
      total: summary.total ?? 0,
      suspicious: summary.suspicious ?? 0,
      lastAnalyzedAt: summary.lastAnalyzedAt ?? null,
      categories: (summary.categories ?? []).map((item) => ({ ...item })),
      levels: (summary.levels ?? []).map((item) => ({ ...item })),
    };
  }
}
