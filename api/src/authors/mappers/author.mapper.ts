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

    const card = new AuthorCardDto();
    card.id = author.id;
    card.vkUserId = author.vkUserId;
    card.firstName = author.firstName;
    card.lastName = author.lastName;

    card.fullName = this.buildFullName(author.firstName, author.lastName);
    card.profileUrl = this.buildProfileUrl({
      vkUserId: author.vkUserId,
      domain: author.domain,
      screenName: author.screenName,
    });

    card.photo50 = author.photo50 ?? null;
    card.photo100 = author.photo100 ?? null;
    card.photo200 = author.photo200Orig ?? null;

    card.domain = author.domain ?? null;
    card.screenName = author.screenName ?? null;

    card.city = this.resolveCity(author.city, author.homeTown ?? null);

    card.summary = normalizedSummary;

    card.photosCount = this.resolvePhotosCount(
      counters.photos,
      normalizedSummary,
    );
    card.audiosCount = counters.audios;
    card.videosCount = counters.videos;
    card.friendsCount = counters.friends;

    card.followersCount = this.resolveFollowersCount(
      author.followersCount,
      counters.followers,
    );

    card.lastSeenAt = AuthorCountersParser.extractLastSeenAt(author.lastSeen);

    card.verifiedAt = this.toIsoOrNull(author.verifiedAt);
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

    // оставляю как было (unknown -> объект), но изолируем в одном месте
    details.country = this.toObjectOrNull(author.country);

    details.createdAt = author.createdAt.toISOString();
    details.updatedAt = author.updatedAt.toISOString();

    return details;
  }

  /* =======================
     Small helpers
     ======================= */

  private static buildFullName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`.trim();
  }

  private static resolvePhotosCount(
    countersPhotos: number | null | undefined,
    summary: PhotoAnalysisSummaryDto,
  ): number | null {
    const summaryPhotos = Number.isFinite(summary.total) ? summary.total : null;
    return countersPhotos ?? summaryPhotos ?? null;
  }

  private static resolveFollowersCount(
    followersCount: number | null,
    countersFollowers: number | null | undefined,
  ): number | null {
    return followersCount ?? countersFollowers ?? null;
  }

  private static toIsoOrNull(value: Date | null): string | null {
    return value ? value.toISOString() : null;
  }

  private static toObjectOrNull(
    value: unknown,
  ): Record<string, unknown> | null {
    if (value && typeof value === 'object') {
      return value as Record<string, unknown>;
    }
    return null;
  }

  private static resolveCity(
    city: unknown,
    homeTown: string | null,
  ): Record<string, unknown> | string | null {
    if (city && typeof city === 'object') {
      const payload = city as Record<string, unknown>;
      const title =
        typeof payload.title === 'string' ? payload.title.trim() : '';
      const name = typeof payload.name === 'string' ? payload.name.trim() : '';

      if (title || name) {
        return payload;
      }
    }

    if (typeof city === 'string' && city.trim()) {
      return city.trim();
    }

    if (homeTown && homeTown.trim()) {
      return homeTown.trim();
    }

    return null;
  }

  private static buildProfileUrl(author: {
    vkUserId: number;
    domain: string | null;
    screenName: string | null;
  }): string {
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
    const safe = summary ?? {
      total: 0,
      suspicious: 0,
      lastAnalyzedAt: null,
      categories: [],
      levels: [],
    };

    return {
      total: safe.total ?? 0,
      suspicious: safe.suspicious ?? 0,
      lastAnalyzedAt: safe.lastAnalyzedAt ?? null,
      categories: (safe.categories ?? []).map((item) => ({ ...item })),
      levels: (safe.levels ?? []).map((item) => ({ ...item })),
    };
  }
}
