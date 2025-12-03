import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Author } from '@prisma/client';
import { PhotoAnalysisService } from '../photo-analysis/photo-analysis.service';
import type {
  AuthorCardDto,
  AuthorDetailsDto,
  AuthorListDto,
} from './dto/author.dto';
import { AuthorActivityService } from '../common/services/author-activity.service';
import { AUTHORS_CONSTANTS } from './authors.constants';
import { AuthorSortBuilder } from './builders/author-sort.builder';
import type { IAuthorsRepository } from './interfaces/authors-repository.interface';
import { AuthorMapper } from './mappers/author.mapper';
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

  constructor(
    @Inject('IAuthorsRepository')
    private readonly repository: IAuthorsRepository,
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
      this.repository.count(where),
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
      AuthorMapper.toCardDto(author, summaryMap.get(author.id)),
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

    return this.repository.queryRaw<Author[]>(query);
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
    const author = await this.repository.findUnique({ vkUserId });

    if (!author) {
      throw new NotFoundException(`Автор с vkUserId=${vkUserId} не найден`);
    }

    const summaries = await this.photoAnalysisService.getSummariesByAuthorIds([
      author.id,
    ]);
    const summary = summaries.get(author.id);

    return AuthorMapper.toDetailsDto(author, summary);
  }

  async refreshAuthors(): Promise<number> {
    return this.authorActivityService.refreshAllAuthors();
  }

}
