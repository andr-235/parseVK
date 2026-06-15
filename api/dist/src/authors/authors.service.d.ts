import { PhotoAnalysisService } from '../photo-analysis/photo-analysis.service.js';
import type { AuthorDetailsDto, AuthorListDto } from './dto/author.dto.js';
import { AuthorsSaverService } from '../common/services/authors-saver.service.js';
import type { IAuthorsRepository } from './interfaces/authors-repository.interface.js';
import type { ListAuthorsOptions } from './types/authors.types.js';
export declare class AuthorsService {
    private readonly repository;
    private readonly photoAnalysisService;
    private readonly authorsSaver;
    private readonly filtersBuilder;
    constructor(repository: IAuthorsRepository, photoAnalysisService: PhotoAnalysisService, authorsSaver: AuthorsSaverService);
    listAuthors(options?: ListAuthorsOptions): Promise<AuthorListDto>;
    getAuthorDetails(vkUserId: number): Promise<AuthorDetailsDto>;
    refreshAuthors(): Promise<number>;
    deleteAuthor(vkUserId: number): Promise<void>;
    markAuthorVerified(vkUserId: number): Promise<{
        verifiedAt: string;
    }>;
    private getAuthorOrThrow;
    private normalizeListOptions;
    private normalizeOffset;
    private normalizeLimit;
    private normalizeSearch;
    private normalizeSortOrder;
    private normalizeSortField;
    private resolveSort;
}
