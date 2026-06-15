import type { IAuthorService } from '../interfaces/photo-loader.interface.js';
import type { IPhotoAnalysisAuthorRepository } from '../interfaces/photo-analysis-author-repository.interface.js';
export declare class AuthorService implements IAuthorService {
    private readonly repository;
    constructor(repository: IPhotoAnalysisAuthorRepository);
    findAuthorByVkId(vkUserId: number): Promise<{
        id: number;
        vkUserId: number;
    }>;
}
