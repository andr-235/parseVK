import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PhotoAnalysisService } from '../photo-analysis/photo-analysis.service';
import type { PhotoAnalysisSummaryDto } from '../photo-analysis/dto/photo-analysis-response.dto';
import type { AuthorDetailsDto, AuthorListDto } from './dto/author.dto';
import { AuthorActivityService } from '../common/services/author-activity.service';
import {
  AUTHORS_CONSTANTS,
  AUTHORS_REPOSITORY,
  SORTABLE_FIELDS,
} from './authors.constants';
import { AuthorFiltersBuilder } from './builders/author-filters.builder';
import { AuthorMapper } from './mappers/author.mapper';
import type { IAuthorsRepository } from './interfaces/authors-repository.interface';
import type {
  AuthorSortDirection,
  AuthorSortField,
  ListAuthorsOptions,
  ResolvedAuthorSort,
} from './types/authors.types';
import type { AuthorRecord } from './types/author-record.type';

@Injectable()
export class AuthorsService {
  // TODO (по желанию): перевести AuthorFiltersBuilder на DI
  private readonly filtersBuilder = new AuthorFiltersBuilder();

  constructor(
    @Inject(AUTHORS_REPOSITORY)
    private readonly repository: IAuthorsRepository,
    private readonly photoAnalysisService: PhotoAnalysisService,
    private readonly authorActivityService: AuthorActivityService,
  ) {}

  async listAuthors(options: ListAuthorsOptions = {}): Promise<AuthorListDto> {
    const { offset, limit, search, city, verified, sort } =
      this.normalizeListOptions(options);

    const { sqlConditions } = this.filtersBuilder.buildFilters(
      search,
      city,
      verified,
    );

    const [total, authors] = await Promise.all([
      this.repository.countByFilters(sqlConditions),
      this.repository.findByFilters({
        sqlConditions,
        offset,
        limit,
        sort,
      }),
    ]);

    const authorIds = authors.map((author: AuthorRecord) => author.id);

    const summaryMap: Map<number, PhotoAnalysisSummaryDto> =
      authorIds.length > 0
        ? await this.photoAnalysisService.getSummariesByAuthorIds(authorIds)
        : new Map<number, PhotoAnalysisSummaryDto>();

    const items = authors.map((author: AuthorRecord) =>
      AuthorMapper.toCardDto(author, summaryMap.get(author.id)),
    );

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  async getAuthorDetails(vkUserId: number): Promise<AuthorDetailsDto> {
    const author = await this.getAuthorOrThrow(vkUserId);

    const summaries = await this.photoAnalysisService.getSummariesByAuthorIds([
      author.id,
    ]);
    const summary = summaries.get(author.id);

    return AuthorMapper.toDetailsDto(author, summary);
  }

  async refreshAuthors(): Promise<number> {
    return this.authorActivityService.refreshAllAuthors();
  }

  async deleteAuthor(vkUserId: number): Promise<void> {
    await this.getAuthorOrThrow(vkUserId);
    await this.repository.deleteAuthorAndComments(vkUserId);
  }

  async markAuthorVerified(vkUserId: number): Promise<{ verifiedAt: string }> {
    const author = await this.getAuthorOrThrow(vkUserId);

    if (author.verifiedAt) {
      return { verifiedAt: author.verifiedAt.toISOString() };
    }

    const verifiedAt = await this.repository.markAuthorVerified(
      vkUserId,
      new Date(),
    );

    return { verifiedAt: verifiedAt.toISOString() };
  }

  /* =======================
     Private helpers
     ======================= */

  private async getAuthorOrThrow(vkUserId: number): Promise<AuthorRecord> {
    const author = await this.repository.findUnique({ vkUserId });
    if (!author) {
      throw new NotFoundException(`Автор с VK ID ${vkUserId} не найден`);
    }
    return author;
  }

  private normalizeListOptions(options: ListAuthorsOptions) {
    const offset = this.normalizeOffset(options.offset);
    const limit = this.normalizeLimit(options.limit);
    const search = this.normalizeSearch(options.search);
    const city = this.normalizeSearch(options.city);

    // verified уже boolean | undefined (после ListAuthorsQueryDto)
    const verified = options.verified;

    const sort = this.resolveSort(
      options.sortBy,
      options.sortOrder ?? null,
      verified,
    );

    return { offset, limit, search, city, verified, sort };
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
  ): string | undefined {
    return value?.trim() || undefined;
  }

  private normalizeSortOrder(
    value: AuthorSortDirection | null,
  ): AuthorSortDirection {
    return value === 'asc' || value === 'desc' ? value : 'desc';
  }

  private normalizeSortField(
    value: AuthorSortField | null | undefined,
  ): AuthorSortField | null {
    if (!value) {
      return null;
    }
    return SORTABLE_FIELDS.has(value) ? value : null;
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
}
