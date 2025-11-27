import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Author } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { PhotoAnalysisService } from '../photo-analysis/photo-analysis.service';
import type {
  AuthorCardDto,
  AuthorDetailsDto,
  AuthorListDto,
} from './dto/author.dto';
import type { PhotoAnalysisSummaryDto } from '../photo-analysis/dto/photo-analysis-response.dto';
import { AuthorActivityService } from '../common/services/author-activity.service';
import { AUTHORS_CONSTANTS } from './authors.constants';
import { AuthorSortBuilder } from './builders/author-sort.builder';
import { AuthorCountersParser } from './parsers/author-counters.parser';
import type {
  AuthorSortDirection,
  AuthorSortField,
  ListAuthorsOptions,
  QueryAuthorsOptions,
  ResolvedAuthorSort,
} from './types/authors.types';

@Injectable()
export class AuthorsService {
  private readonly sortBuilder = new AuthorSortBuilder();
  private readonly countersParser = new AuthorCountersParser();

  constructor(
    private readonly prisma: PrismaService,
    private readonly photoAnalysisService: PhotoAnalysisService,
    private readonly authorActivityService: AuthorActivityService,
  ) {}

  async listAuthors(options: ListAuthorsOptions = {}): Promise<AuthorListDto> {
    const offset = Math.max(options.offset ?? 0, 0);
    const limit = Math.min(
      Math.max(options.limit ?? AUTHORS_CONSTANTS.DEFAULT_LIMIT, 1),
      AUTHORS_CONSTANTS.MAX_LIMIT,
    );
    const search = options.search?.trim();
    const sort = this.resolveSort(
      options.sortBy,
      options.sortOrder,
      options.verified,
    );
    const { where, sqlConditions } = this.buildFilters(
      search,
      options.verified,
    );

    const [total, authors] = await Promise.all([
      this.prisma.author.count({ where }),
      this.queryAuthors({
        sqlConditions,
        offset,
        limit,
        sort,
      }),
    ]);

    const authorIds = authors.map((author) => author.id);
    const summaryMap =
      await this.photoAnalysisService.getSummariesByAuthorIds(authorIds);

    const items: AuthorCardDto[] = authors.map((author) =>
      this.buildAuthorCard(author, summaryMap.get(author.id)),
    );

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  private static readonly SORTABLE_FIELDS: ReadonlySet<AuthorSortField> =
    new Set<AuthorSortField>([
      'fullName',
      'photosCount',
      'audiosCount',
      'videosCount',
      'friendsCount',
      'followersCount',
      'lastSeenAt',
      'verifiedAt',
      'updatedAt',
    ]);

  private async queryAuthors(
    options: QueryAuthorsOptions,
  ): Promise<Author[]> {
    const whereClause = options.sqlConditions.length
      ? Prisma.sql`WHERE ${Prisma.join(options.sqlConditions, ' AND ')}`
      : Prisma.sql``;

    const orderClause = this.sortBuilder.buildOrderClause(options.sort);

    const query = Prisma.sql`
      SELECT *
      FROM "Author"
      ${whereClause}
      ORDER BY ${orderClause}
      OFFSET ${options.offset}
      LIMIT ${options.limit}
    `;

    return this.prisma.$queryRaw<Author[]>(query);
  }

  private buildFilters(
    search: string | null | undefined,
    verified?: boolean,
  ): { where?: Prisma.AuthorWhereInput; sqlConditions: Prisma.Sql[] } {
    const filters: Prisma.AuthorWhereInput[] = [];
    const sqlConditions: Prisma.Sql[] = [];

    if (search) {
      const numericId = Number.parseInt(search, 10);
      const orFilters: Prisma.AuthorWhereInput[] = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
        { screenName: { contains: search, mode: 'insensitive' } },
      ];

      const searchTerm = `%${search.toLowerCase()}%`;
      const searchSqlParts: Prisma.Sql[] = [
        Prisma.sql`LOWER("Author"."firstName") LIKE ${searchTerm}`,
        Prisma.sql`LOWER("Author"."lastName") LIKE ${searchTerm}`,
        Prisma.sql`LOWER("Author"."domain") LIKE ${searchTerm}`,
        Prisma.sql`LOWER("Author"."screenName") LIKE ${searchTerm}`,
      ];

      if (!Number.isNaN(numericId)) {
        orFilters.push({ vkUserId: numericId });
        searchSqlParts.push(Prisma.sql`"Author"."vkUserId" = ${numericId}`);
      }

      filters.push({ OR: orFilters });
      sqlConditions.push(Prisma.sql`(${Prisma.join(searchSqlParts, ' OR ')})`);
    }

    if (verified === true) {
      filters.push({ verifiedAt: { not: null } });
      sqlConditions.push(Prisma.sql`"Author"."verifiedAt" IS NOT NULL`);
    } else if (verified === false) {
      filters.push({ verifiedAt: null });
      sqlConditions.push(Prisma.sql`"Author"."verifiedAt" IS NULL`);
    }

    const where = filters.length ? { AND: filters } : undefined;

    return {
      where,
      sqlConditions,
    };
  }

  private resolveSort(
    sortBy: AuthorSortField | string | null | undefined,
    sortOrder: AuthorSortDirection | string | null | undefined,
    verified?: boolean,
  ): ResolvedAuthorSort {
    const normalizedField = this.normalizeSortField(sortBy);
    const normalizedOrder: AuthorSortDirection =
      sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : 'desc';

    if (normalizedField) {
      return {
        field: normalizedField,
        order: normalizedOrder,
      };
    }

    if (verified === true) {
      return {
        field: 'verifiedAt',
        order: 'desc',
      };
    }

    return {
      field: 'updatedAt',
      order: 'desc',
    };
  }

  private normalizeSortField(
    value: AuthorSortField | string | null | undefined,
  ): AuthorSortField | null {
    if (!value) {
      return null;
    }

    if (AuthorsService.SORTABLE_FIELDS.has(value as AuthorSortField)) {
      return value as AuthorSortField;
    }

    return null;
  }


  async getAuthorDetails(vkUserId: number): Promise<AuthorDetailsDto> {
    const author = await this.prisma.author.findUnique({
      where: { vkUserId },
    });

    if (!author) {
      throw new NotFoundException(`Автор с vkUserId=${vkUserId} не найден`);
    }

    const summaries = await this.photoAnalysisService.getSummariesByAuthorIds([
      author.id,
    ]);
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

  private cloneSummary(
    summary?: PhotoAnalysisSummaryDto,
  ): PhotoAnalysisSummaryDto {
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
    author: Author,
    summary?: PhotoAnalysisSummaryDto,
  ): AuthorCardDto {
    const normalizedSummary = this.cloneSummary(summary);
    const counters = this.extractCounters(author.counters);
    const summaryPhotos = Number.isFinite(normalizedSummary.total)
      ? normalizedSummary.total
      : null;
    const photosCount = counters.photos ?? summaryPhotos ?? null;
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
      photosCount,
      audiosCount: counters.audios,
      videosCount: counters.videos,
      friendsCount: counters.friends,
      followersCount: followers,
      lastSeenAt: this.extractLastSeenAt(author.lastSeen),
      verifiedAt: author.verifiedAt ? author.verifiedAt.toISOString() : null,
      isVerified: Boolean(author.verifiedAt),
    };
  }

  private extractCounters(value: Prisma.JsonValue | null) {
    return this.countersParser.extractCounters(value);
  }

  private extractLastSeenAt(value: Prisma.JsonValue | null): string | null {
    return this.countersParser.extractLastSeenAt(value);
  }
}
