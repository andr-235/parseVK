import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PhotoAnalysisService } from '../photo-analysis/photo-analysis.service';
import type { AuthorDetailsDto, AuthorListDto } from './dto/author.dto';
import { AuthorActivityService } from '../common/services/author-activity.service';
import { AUTHORS_CONSTANTS, SORTABLE_FIELDS } from './authors.constants';
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
      this.repository.countByFilters(sqlConditions),
      this.repository.findByFilters({
        sqlConditions,
        offset,
        limit,
        sort,
      }),
    ]);

    const authorIds: number[] = authors.map(
      (author: AuthorRecord) => author.id,
    );
    const summaryMap =
      await this.photoAnalysisService.getSummariesByAuthorIds(authorIds);

    const items = authors.map((author: AuthorRecord) =>
      AuthorMapper.toCardDto(author, summaryMap.get(author.id)),
    );

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
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
    const author = await this.repository.findUnique({ vkUserId });
    if (!author) {
      throw new NotFoundException(`Автор с VK ID ${vkUserId} не найден`);
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

  async deleteAuthor(vkUserId: number): Promise<void> {
    const author = await this.repository.findUnique({ vkUserId });
    if (!author) {
      throw new NotFoundException(`Автор с VK ID ${vkUserId} не найден`);
    }

    await this.repository.deleteAuthorAndComments(vkUserId);
  }
}
