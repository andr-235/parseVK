import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { PhotoAnalysisService } from '../photo-analysis/photo-analysis.service';
import type { AuthorCardDto, AuthorDetailsDto, AuthorListDto } from './dto/author.dto';
import type { PhotoAnalysisSummaryDto } from '../photo-analysis/dto/photo-analysis-response.dto';
import { AuthorActivityService } from '../common/services/author-activity.service';

interface ListAuthorsOptions {
  offset?: number;
  limit?: number;
  search?: string | null;
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

    let where: Prisma.AuthorWhereInput | undefined;

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

      where = { OR: orFilters };
    }

    const [total, authors] = await Promise.all([
      this.prisma.author.count({ where }),
      this.prisma.author.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
    ]);

    const authorIds = authors.map((author) => author.id);
    const summaryMap = await this.photoAnalysisService.getSummariesByAuthorIds(authorIds);

    const items: AuthorCardDto[] = authors.map((author) => ({
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
      summary: this.cloneSummary(summaryMap.get(author.id)),
    }));

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  async getAuthorDetails(vkUserId: number): Promise<AuthorDetailsDto> {
    const author = await this.prisma.author.findUnique({ where: { vkUserId } });

    if (!author) {
      throw new NotFoundException(`Автор с vkUserId=${vkUserId} не найден`);
    }

    const summaries = await this.photoAnalysisService.getSummariesByAuthorIds([author.id]);
    const summary = this.cloneSummary(summaries.get(author.id));

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
      summary,
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
}
