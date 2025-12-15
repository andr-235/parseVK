import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Author } from '@prisma/client';
import { PhotoAnalysisService } from '../photo-analysis/photo-analysis.service';
import type { AuthorDetailsDto, AuthorListDto } from './dto/author.dto';
import { AuthorActivityService } from '../common/services/author-activity.service';
import { AUTHORS_CONSTANTS, SORTABLE_FIELDS } from './authors.constants';
import { AuthorSortBuilder } from './builders/author-sort.builder';
import { AuthorFiltersBuilder } from './builders/author-filters.builder';
import { AuthorMapper } from './mappers/author.mapper';
import type { IAuthorsRepository } from './interfaces/authors-repository.interface';
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
  private readonly filtersBuilder = new AuthorFiltersBuilder();

  constructor(
    @Inject('IAuthorsRepository')
    private readonly repository: IAuthorsRepository,
    private readonly photoAnalysisService: PhotoAnalysisService,
    private readonly authorActivityService: AuthorActivityService,
  ) {}

  async listAuthors(options: ListAuthorsOptions = {}): Promise<AuthorListDto> {
    const offset = this.normalizeOffset(options.offset);
    const limit = this.normalizeLimit(options.limit);
    const search = this.normalizeSearch(options.search);
    const sort = this.resolveSort(
      options.sortBy,
      options.sortOrder ?? null,
      options.verified,
    );
    const { sqlConditions } = this.filtersBuilder.buildFilters(
      search,
      options.verified,
    );

    const [total, authors] = await Promise.all([
      this.countAuthors(sqlConditions),
      this.queryAuthors({
        sqlConditions,
        offset,
        limit,
        sort,
      }),
    ]);

    const authorIds: number[] = authors.map((author: Author) => author.id);
    const summaryMap =
      await this.photoAnalysisService.getSummariesByAuthorIds(authorIds);

    const items = authors.map((author: Author) =>
      AuthorMapper.toCardDto(author, summaryMap.get(author.id)),
    );

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  private buildWhereClause(sqlConditions: Prisma.Sql[]): Prisma.Sql {
    return sqlConditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(sqlConditions, ' AND ')}`
      : Prisma.sql``;
  }

  private async countAuthors(sqlConditions: Prisma.Sql[]): Promise<number> {
    const whereClause = this.buildWhereClause(sqlConditions);

    const query: Prisma.Sql = Prisma.sql`
      SELECT COUNT(*)::int
      FROM "Author"
      ${whereClause}
    `;

    const result = await this.repository.queryRaw<[{ count: number }]>(query);
    return result[0]?.count ?? 0;
  }

  private queryAuthors(options: QueryAuthorsOptions): Promise<Author[]> {
    const whereClause = this.buildWhereClause(options.sqlConditions);
    const orderClause = this.sortBuilder.buildOrderClause(options.sort);

    const query: Prisma.Sql = Prisma.sql`
      SELECT *
      FROM "Author"
      ${whereClause}
      ORDER BY ${orderClause}
      OFFSET ${options.offset}
      LIMIT ${options.limit}
    `;

    return this.repository.queryRaw<Author[]>(query);
  }

  private normalizeSortOrder(
    value: AuthorSortDirection | null,
  ): AuthorSortDirection {
    return value === 'asc' || value === 'desc' ? value : 'desc';
  }

  private resolveSort(
    sortBy: AuthorSortField | null | undefined,
    sortOrder: AuthorSortDirection | null,
    verified?: boolean,
  ): ResolvedAuthorSort {
    const normalizedField = this.normalizeSortField(sortBy);

    if (normalizedField) {
      return {
        field: normalizedField,
        order: this.normalizeSortOrder(sortOrder),
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

  private normalizeOffset(value: number | null | undefined): number {
    return Math.max(value ?? 0, 0);
  }

  private normalizeLimit(value: number | null | undefined): number {
    return Math.min(
      Math.max(value ?? AUTHORS_CONSTANTS.DEFAULT_LIMIT, 1),
      AUTHORS_CONSTANTS.MAX_LIMIT,
    );
  }

  private normalizeSearch(
    value: string | null | undefined,
  ): string | null | undefined {
    return value?.trim() || undefined;
  }

  private normalizeSortField(
    value: AuthorSortField | null | undefined,
  ): AuthorSortField | null {
    if (!value) {
      return null;
    }

    if (SORTABLE_FIELDS.has(value)) {
      return value;
    }

    return null;
  }

  async getAuthorDetails(vkUserId: number): Promise<AuthorDetailsDto> {
    try {
      const author = await this.repository.findUnique({ vkUserId });

      const summaries = await this.photoAnalysisService.getSummariesByAuthorIds(
        [author.id],
      );
      const summary = summaries.get(author.id);

      return AuthorMapper.toDetailsDto(author, summary);
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        typeof (error as { code: unknown }).code === 'string' &&
        (error as { code: string }).code === 'P2025'
      ) {
        throw new NotFoundException(`Автор с VK ID ${vkUserId} не найден`);
      }
      throw error;
    }
  }

  async refreshAuthors(): Promise<number> {
    return this.authorActivityService.refreshAllAuthors();
  }
}
