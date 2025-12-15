import { Inject, Injectable } from '@nestjs/common';
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
    const { where, sqlConditions } = this.filtersBuilder.buildFilters(
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

  private queryAuthors(options: QueryAuthorsOptions): Promise<Author[]> {
    const whereClause: Prisma.Sql =
      options.sqlConditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(options.sqlConditions, ' AND ')}`
        : Prisma.sql``;

    const orderClause: Prisma.Sql = this.sortBuilder.buildOrderClause(
      options.sort,
    );

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

  private resolveSort(
    sortBy: AuthorSortField | null | undefined,
    sortOrder: AuthorSortDirection | null | undefined,
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
    const author = await this.repository.findUnique({ vkUserId });

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
