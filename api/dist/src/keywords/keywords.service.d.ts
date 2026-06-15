import { IKeywordResponse, IDeleteResponse, IBulkAddResponse, IKeywordFormsResponse } from './interfaces/keyword.interface.js';
import type { IKeywordsRepository } from './interfaces/keywords-repository.interface.js';
import { KeywordFormsService } from './services/keyword-forms.service.js';
import { KeywordsMatchesService } from './services/keywords-matches.service.js';
export declare class KeywordsService {
    private readonly repository;
    private readonly matchesService;
    private readonly formsService;
    constructor(repository: IKeywordsRepository, matchesService: KeywordsMatchesService, formsService: KeywordFormsService);
    addKeyword(word: string, category?: string, isPhrase?: boolean): Promise<IKeywordResponse>;
    updateKeywordCategory(id: number, category?: string | null): Promise<IKeywordResponse>;
    bulkAddKeywords(words: string[]): Promise<IBulkAddResponse>;
    addKeywordsFromFile(fileContent: string): Promise<IBulkAddResponse>;
    private bulkAddKeywordEntries;
    deleteKeyword(id: number): Promise<IDeleteResponse>;
    deleteAllKeywords(): Promise<IDeleteResponse>;
    getAllKeywords(): Promise<{
        keywords: IKeywordResponse[];
        total: number;
        page: number;
        limit: number;
    }>;
    getKeywords(options?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{
        keywords: IKeywordResponse[];
        total: number;
        page: number;
        limit: number;
    }>;
    getKeywordWords(): Promise<string[]>;
    getKeywordForms(id: number): Promise<IKeywordFormsResponse>;
    addManualKeywordForm(id: number, form: string): Promise<IKeywordFormsResponse>;
    removeManualKeywordForm(id: number, form: string): Promise<IKeywordFormsResponse>;
    addKeywordFormExclusion(id: number, form: string): Promise<IKeywordFormsResponse>;
    removeKeywordFormExclusion(id: number, form: string): Promise<IKeywordFormsResponse>;
    recalculateKeywordMatches(): Promise<{
        processed: number;
        updated: number;
        created: number;
        deleted: number;
    }>;
    rebuildKeywordForms(): Promise<{
        keywordsRebuilt: number;
        processed: number;
        updated: number;
        created: number;
        deleted: number;
    }>;
    private ensureSingleWordKeyword;
    private ensureNormalizedForm;
    private collectFormsBySource;
}
