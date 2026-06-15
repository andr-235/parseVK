import { AuthorsService } from './authors.service.js';
import type { AuthorDetailsDto, AuthorListDto } from './dto/author.dto.js';
import { ListAuthorsQueryDto } from './dto/list-authors-query.dto.js';
export declare class AuthorsController {
    private readonly authorsService;
    constructor(authorsService: AuthorsService);
    listAuthors(query: ListAuthorsQueryDto): Promise<AuthorListDto>;
    getAuthorDetails(vkUserId: number): Promise<AuthorDetailsDto>;
    refreshAuthors(): Promise<{
        updated: number;
    }>;
    deleteAuthor(vkUserId: number): Promise<{
        deleted: boolean;
    }>;
    verifyAuthor(vkUserId: number): Promise<{
        verifiedAt: string;
    }>;
}
