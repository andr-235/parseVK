import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Author as AuthorModel } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { PhotoAnalysisService } from '../photo-analysis/photo-analysis.service';
import type {
  AuthorCardDto,
  AuthorDetailsDto,
  AuthorListDto,
} from './dto/author.dto';
import type { PhotoAnalysisSummaryDto } from '../photo-analysis/dto/photo-analysis-response.dto';
import { AuthorActivityService } from '../common/services/author-activity.service';

type AuthorSortField =
  | 'fullName'
  | 'photosCount'
  | 'audiosCount'
  | 'videosCount'
  | 'friendsCount'
  | 'followersCount'
  | 'lastSeenAt'
  | 'verifiedAt'
  | 'updatedAt';

type AuthorSortDirection = 'asc' | 'desc';

interface ListAuthorsOptions {
  offset?: number;
  limit?: number;
  search?: string | null;
  verified?: boolean;
  sortBy?: AuthorSortField | string | null;
  sortOrder?: AuthorSortDirection | string | null;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

interface ResolvedAuthorSort {
  field: AuthorSortField;
  order: AuthorSortDirection;
}

interface QueryAuthorsOptions {
  sqlConditions: Prisma.Sql[];
  offset: number;
  limit: number;
  sort: ResolvedAuthorSort;
}

@Injectable()
export class AuthorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly photoAnalysisService: PhotoAnalysisService,
    private readonly authorActivityService: AuthorActivityService,
  ) {}

  async listAuthors(options: ListAuthorsOptions = {}): Promise<AuthorListDto> {
    const offset = Math.max(options.offset ?? 0, 0);
    const limit = Math.min(
      Math.max(options.limit ?? DEFAULT_LIMIT, 1),
      MAX_LIMIT,
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
  ): Promise<AuthorModel[]> {
    const whereClause = options.sqlConditions.length
      ? Prisma.sql`WHERE ${Prisma.join(options.sqlConditions, ' AND ')}`
      : Prisma.sql``;

    const orderClause = this.buildOrderClause(options.sort);

    const query = Prisma.sql`
      SELECT *
      FROM "Author"
      ${whereClause}
      ORDER BY ${orderClause}
      OFFSET ${options.offset}
      LIMIT ${options.limit}
    `;

    return this.prisma.$queryRaw<AuthorModel[]>(query);
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

  private buildOrderClause(sort: ResolvedAuthorSort): Prisma.Sql {
    const expressions: Prisma.Sql[] = [];

    switch (sort.field) {
      case 'fullName':
        expressions.push(
          this.applyDirection(
            Prisma.sql`LOWER("Author"."lastName")`,
            sort.order,
          ),
        );
        expressions.push(
          this.applyDirection(
            Prisma.sql`LOWER("Author"."firstName")`,
            sort.order,
          ),
        );
        expressions.push(
          this.applyDirection(Prisma.sql`"Author"."vkUserId"`, sort.order),
        );
        break;
      case 'photosCount':
        expressions.push(
          this.applyDirection(
            this.buildCounterValueExpression(['photos', 'photos_count']),
            sort.order,
            {
              nullsLast: true,
            },
          ),
        );
        break;
      case 'audiosCount':
        expressions.push(
          this.applyDirection(
            this.buildCounterValueExpression(['audios', 'audio']),
            sort.order,
            {
              nullsLast: true,
            },
          ),
        );
        break;
      case 'videosCount':
        expressions.push(
          this.applyDirection(
            this.buildCounterValueExpression(['videos', 'video']),
            sort.order,
            {
              nullsLast: true,
            },
          ),
        );
        break;
      case 'friendsCount':
        expressions.push(
          this.applyDirection(
            this.buildCounterValueExpression(['friends']),
            sort.order,
            {
              nullsLast: true,
            },
          ),
        );
        break;
      case 'followersCount':
        expressions.push(
          this.applyDirection(
            this.buildFollowersValueExpression(),
            sort.order,
            {
              nullsLast: true,
            },
          ),
        );
        break;
      case 'lastSeenAt':
        expressions.push(
          this.applyDirection(this.buildLastSeenValueExpression(), sort.order, {
            nullsLast: true,
          }),
        );
        break;
      case 'verifiedAt':
        expressions.push(
          this.applyDirection(Prisma.sql`"Author"."verifiedAt"`, sort.order, {
            nullsLast: true,
          }),
        );
        break;
      case 'updatedAt':
      default:
        expressions.push(
          this.applyDirection(Prisma.sql`"Author"."updatedAt"`, sort.order),
        );
        break;
    }

    expressions.push(Prisma.sql`"Author"."updatedAt" DESC`);
    expressions.push(Prisma.sql`"Author"."id" DESC`);

    return Prisma.join(expressions, ', ');
  }

  private applyDirection(
    expression: Prisma.Sql,
    order: AuthorSortDirection,
    options: { nullsLast?: boolean } = {},
  ): Prisma.Sql {
    const direction = order === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
    const nulls = options.nullsLast ? Prisma.sql` NULLS LAST` : Prisma.sql``;
    return Prisma.sql`${expression} ${direction}${nulls}`;
  }

  private buildCounterValueExpression(keys: string[]): Prisma.Sql {
    const expressions = keys.map((key) =>
      this.buildCounterValueExpressionForKey(key),
    );

    if (expressions.length === 1) {
      return expressions[0];
    }

    return Prisma.sql`COALESCE(${Prisma.join(expressions, ', ')})`;
  }

  private buildCounterValueExpressionForKey(key: string): Prisma.Sql {
    const keyLiteral = Prisma.raw(`'${key}'`);

    const numericPath = Prisma.sql`
      jsonb_path_query_first(
        "Author"."counters"->${keyLiteral},
        '$.** ? (@.type() == "number")'
      )
    `;

    const stringPath = Prisma.sql`
      jsonb_path_query_first(
        "Author"."counters"->${keyLiteral},
        '$.** ? (@.type() == "string" && @ like_regex "^-?\\\\d+$")'
      )
    `;

    return Prisma.sql`
      CASE
        WHEN jsonb_typeof("Author"."counters"->${keyLiteral}) = 'number'
          THEN ("Author"."counters"->>${keyLiteral})::numeric
        WHEN jsonb_typeof("Author"."counters"->${keyLiteral}) = 'string'
          AND ("Author"."counters"->>${keyLiteral}) ~ '^-?\\d+$'
          THEN ("Author"."counters"->>${keyLiteral})::numeric
        WHEN jsonb_typeof("Author"."counters"->${keyLiteral}) = 'object'
          THEN COALESCE(
            (${numericPath})::text::numeric,
            CASE
              WHEN ${stringPath} IS NOT NULL
              THEN NULLIF(TRIM(BOTH '"' FROM (${stringPath})::text), '')::numeric
              ELSE NULL
            END
          )
        ELSE NULL
      END
    `;
  }

  private buildFollowersValueExpression(): Prisma.Sql {
    const directValue = Prisma.sql`
      CASE
        WHEN "Author"."followersCount" IS NOT NULL
        THEN "Author"."followersCount"::numeric
        ELSE NULL
      END
    `;

    const countersValue = this.buildCounterValueExpression([
      'followers',
      'subscribers',
    ]);

    return Prisma.sql`COALESCE(${directValue}, ${countersValue})`;
  }

  private buildLastSeenValueExpression(): Prisma.Sql {
    const trimmedValue = Prisma.sql`NULLIF(trim('"' FROM "Author"."lastSeen"::text), '')`;

    const numericFromRoot = this.buildUnixMillisExpression(trimmedValue);

    const stringCase = Prisma.sql`
      CASE
        WHEN ${trimmedValue} ~ '^-?\\d+$' THEN ${this.buildUnixMillisExpression(trimmedValue)}
        WHEN ${trimmedValue} ~ '^\\d{4}-\\d{2}-\\d{2}'
          THEN FLOOR(EXTRACT(EPOCH FROM (${trimmedValue})::timestamptz) * 1000)
        ELSE NULL
      END
    `;

    const timeFromObject = this.buildUnixMillisExpression(
      Prisma.sql`"Author"."lastSeen"->>'time'`,
    );
    const dateFromObject = Prisma.sql`
      CASE
        WHEN ("Author"."lastSeen"->>'date') ~ '^\\d{4}-\\d{2}-\\d{2}'
        THEN FLOOR(EXTRACT(EPOCH FROM ("Author"."lastSeen"->>'date')::timestamptz) * 1000)
        ELSE NULL
      END
    `;

    return Prisma.sql`
      CASE
        WHEN "Author"."lastSeen" IS NULL THEN NULL
        WHEN jsonb_typeof("Author"."lastSeen") = 'number' THEN ${numericFromRoot}
        WHEN jsonb_typeof("Author"."lastSeen") = 'string' THEN ${stringCase}
        WHEN jsonb_typeof("Author"."lastSeen") = 'object'
          THEN COALESCE(${timeFromObject}, ${dateFromObject})
        ELSE NULL
      END
    `;
  }

  private buildUnixMillisExpression(value: Prisma.Sql): Prisma.Sql {
    return Prisma.sql`
      CASE
        WHEN ${value} IS NULL THEN NULL
        WHEN ${value} ~ '^-?\\d+$' THEN
          CASE
            WHEN (${value})::numeric > 10000000000 THEN (${value})::numeric
            ELSE (${value})::numeric * 1000
          END
        ELSE NULL
      END
    `;
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
    author: AuthorModel,
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
      followers: this.parseCounterValue(
        counters.followers ?? counters.subscribers,
      ),
    };
  }

  private parseCounterValue(value: unknown, depth = 0): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return null;
      }
      const numeric = Number.parseInt(trimmed, 10);
      if (!Number.isNaN(numeric)) {
        return numeric;
      }
    }

    if (depth >= 4) {
      return null;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const resolved = this.parseCounterValue(item, depth + 1);
        if (resolved !== null) {
          return resolved;
        }
      }
      return null;
    }

    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const preferredKeys = [
        'count',
        'value',
        'total',
        'amount',
        'items',
        'length',
        'quantity',
        'num',
      ];

      for (const key of preferredKeys) {
        if (Object.prototype.hasOwnProperty.call(record, key)) {
          const resolved = this.parseCounterValue(record[key], depth + 1);
          if (resolved !== null) {
            return resolved;
          }
        }
      }

      for (const nestedValue of Object.values(record)) {
        const resolved = this.parseCounterValue(nestedValue, depth + 1);
        if (resolved !== null) {
          return resolved;
        }
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
