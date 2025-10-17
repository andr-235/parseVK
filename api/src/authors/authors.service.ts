import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Author as AuthorModel } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { PhotoAnalysisService } from '../photo-analysis/photo-analysis.service';
import type { AuthorCardDto, AuthorDetailsDto, AuthorListDto } from './dto/author.dto';
import type { PhotoAnalysisSummaryDto } from '../photo-analysis/dto/photo-analysis-response.dto';
import { AuthorActivityService } from '../common/services/author-activity.service';

interface ListAuthorsOptions {
  offset?: number;
  limit?: number;
  search?: string | null;
  verified?: boolean;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class AuthorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly photoAnalysisService: PhotoAnalysisService,
    private readonly authorActivityService: AuthorActivityService,
  ) {}

  async listAuthors(options: ListAuthorsOptions = {}): Promise<AuthorListDto> {
    const offset = Math.max(options.offset ?? 0, 0);
    const limit = Math.min(Math.max(options.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const search = options.search?.trim();
    const filters: Prisma.AuthorWhereInput[] = [];

    if (search) {
      const numericId = Number.parseInt(search, 10);
      const orFilters: Prisma.AuthorWhereInput[] = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
        { screenName: { contains: search, mode: 'insensitive' } },
      ];

      if (!Number.isNaN(numericId)) {
        orFilters.push({ vkUserId: numericId });
      }

      filters.push({ OR: orFilters });
    }

    if (options.verified === true) {
      filters.push({ verifiedAt: { not: null } });
    } else if (options.verified === false) {
      filters.push({ verifiedAt: null });
    }

    const where = filters.length ? { AND: filters } : undefined;
    const orderBy: Prisma.AuthorOrderByWithRelationInput =
      options.verified === true ? { verifiedAt: 'desc' } : { updatedAt: 'desc' };

    const [total, authors] = await Promise.all([
      this.prisma.author.count({ where }),
      this.prisma.author.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
      }),
    ]);

    const authorIds = authors.map((author) => author.id);
    const summaryMap = await this.photoAnalysisService.getSummariesByAuthorIds(authorIds);

    const items: AuthorCardDto[] = authors.map((author) =>
      this.buildAuthorCard(author, summaryMap.get(author.id)),
    );

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  async getAuthorDetails(vkUserId: number): Promise<AuthorDetailsDto> {
    let author: AuthorModel;

    try {
      author = await this.prisma.author.update({
        where: { vkUserId },
        data: { verifiedAt: new Date() },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Автор с vkUserId=${vkUserId} не найден`);
      }

      throw error;
    }

    const summaries = await this.photoAnalysisService.getSummariesByAuthorIds([author.id]);
    const summary = summaries.get(author.id);
    const card = this.buildAuthorCard(author, summary);

    return {
      ...card,
      city: (author.city as Record<string, unknown>) ?? null,
      country: (author.country as Record<string, unknown>) ?? null,
      createdAt: author.createdAt.toISOString(),
      updatedAt: author.updatedAt.toISOString(),
    };
  }

  async refreshAuthors(): Promise<number> {
    return this.authorActivityService.refreshAllAuthors();
  }

  private buildProfileUrl(author: {
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

  private cloneSummary(summary?: PhotoAnalysisSummaryDto): PhotoAnalysisSummaryDto {
    if (!summary) {
      return this.photoAnalysisService.getEmptySummary();
    }

    return {
      total: summary.total,
      suspicious: summary.suspicious,
      lastAnalyzedAt: summary.lastAnalyzedAt,
      categories: summary.categories.map((item) => ({ ...item })),
      levels: summary.levels.map((item) => ({ ...item })),
    };
  }

  private buildAuthorCard(
    author: AuthorModel,
    summary?: PhotoAnalysisSummaryDto,
  ): AuthorCardDto {
    const normalizedSummary = this.cloneSummary(summary);
    const counters = this.extractCounters(author.counters);
    const followers = author.followersCount ?? counters.followers ?? null;

    return {
      id: author.id,
      vkUserId: author.vkUserId,
      firstName: author.firstName,
      lastName: author.lastName,
      fullName: `${author.firstName} ${author.lastName}`.trim(),
      photo50: author.photo50 ?? null,
      photo100: author.photo100 ?? null,
      photo200: author.photo200Orig ?? null,
      domain: author.domain ?? null,
      screenName: author.screenName ?? null,
      profileUrl: this.buildProfileUrl(author),
      summary: normalizedSummary,
      photosCount: counters.photos,
      audiosCount: counters.audios,
      videosCount: counters.videos,
      friendsCount: counters.friends,
      followersCount: followers,
      lastSeenAt: this.extractLastSeenAt(author.lastSeen),
      verifiedAt: author.verifiedAt ? author.verifiedAt.toISOString() : null,
      isVerified: Boolean(author.verifiedAt),
    };
  }

  private extractCounters(value: Prisma.JsonValue | null): {
    photos: number | null;
    audios: number | null;
    videos: number | null;
    friends: number | null;
    followers: number | null;
  } {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {
        photos: null,
        audios: null,
        videos: null,
        friends: null,
        followers: null,
      };
    }

    const counters = value as Record<string, unknown>;

    return {
      photos: this.parseCounterValue(counters.photos ?? counters.photos_count),
      audios: this.parseCounterValue(counters.audios ?? counters.audio),
      videos: this.parseCounterValue(counters.videos ?? counters.video),
      friends: this.parseCounterValue(counters.friends),
      followers: this.parseCounterValue(counters.followers ?? counters.subscribers),
    };
  }

  private parseCounterValue(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const numeric = Number.parseInt(value, 10);
      if (!Number.isNaN(numeric)) {
        return numeric;
      }
    }

    return null;
  }

  private extractLastSeenAt(value: Prisma.JsonValue | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return this.toIsoDate(value);
    }

    if (typeof value === 'string') {
      const directDate = new Date(value);
      if (!Number.isNaN(directDate.getTime())) {
        return directDate.toISOString();
      }

      const numeric = Number.parseInt(value, 10);
      if (!Number.isNaN(numeric)) {
        return this.toIsoDate(numeric);
      }

      return null;
    }

    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return null;
      }

      const data = value as Record<string, unknown>;
      const time = data.time;

      if (typeof time === 'number' && Number.isFinite(time)) {
        return this.toIsoDate(time);
      }

      if (typeof time === 'string') {
        const numeric = Number.parseInt(time, 10);
        if (!Number.isNaN(numeric)) {
          return this.toIsoDate(numeric);
        }
      }

      const dateValue = data.date;
      if (typeof dateValue === 'string') {
        const date = new Date(dateValue);
        if (!Number.isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }

    return null;
  }

  private toIsoDate(timestamp: number): string | null {
    const multiplier = timestamp > 10_000_000_000 ? 1 : 1000;
    const date = new Date(timestamp * multiplier);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  }
}
