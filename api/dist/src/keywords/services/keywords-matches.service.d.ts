import type { IKeywordsRepository } from '../interfaces/keywords-repository.interface.js';
export declare class KeywordsMatchesService {
    private readonly repository;
    constructor(repository: IKeywordsRepository);
    recalculateKeywordMatches(): Promise<{
        processed: number;
        updated: number;
        created: number;
        deleted: number;
    }>;
    recalculateKeywordMatchesForKeyword(keywordId: number): Promise<{
        processed: number;
        updated: number;
        created: number;
        deleted: number;
    }>;
    private recalculateForCandidates;
}
