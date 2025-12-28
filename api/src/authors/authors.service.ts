import { Inject, Injectable } from '@nestjs/common';
import type { Author } from '@prisma/client';
import { PhotoAnalysisService } from '../photo-analysis/photo-analysis.service';
import type { AuthorDetailsDto, AuthorListDto } from './dto/author.dto';
import { AuthorActivityService } from '../common/services/author-activity.service';
import { AuthorsQueryBuilder } from './builders/authors-query.builder';
import { AuthorsParameterNormalizer } from './normalizers/authors-parameter.normalizer';
import { AuthorFiltersBuilder } from './builders/author-filters.builder';
import { AuthorMapper } from './mappers/author.mapper';
import type { IAuthorsRepository } from './interfaces/authors-repository.interface';
import type { ListAuthorsOptions } from './types/authors.types';

@Injectable()
export class AuthorsService {
  private readonly filtersBuilder = new AuthorFiltersBuilder();

  constructor(
    @Inject('IAuthorsRepository')
    private readonly repository: IAuthorsRepository,
    private readonly queryBuilder: AuthorsQueryBuilder,
    private readonly parameterNormalizer: AuthorsParameterNormalizer,
    private readonly photoAnalysisService: PhotoAnalysisService,
    private readonly authorActivityService: AuthorActivityService,
  ) {}

  async listAuthors(options: ListAuthorsOptions = {}): Promise<AuthorListDto> {
    const offset = this.parameterNormalizer.normalizeOffset(options.offset);
    const limit = this.parameterNormalizer.normalizeLimit(options.limit);
    const search = this.parameterNormalizer.normalizeSearch(options.search);
    const sort = this.parameterNormalizer.resolveSort(
      options.sortBy,
      options.sortOrder ?? null,
      options.verified,
    );
    const { sqlConditions } = this.filtersBuilder.buildFilters(
      search,
      options.verified,
    );

    const [total, authors] = await Promise.all([
      this.queryBuilder.countAuthors(sqlConditions),
      this.queryBuilder.queryAuthors({
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
