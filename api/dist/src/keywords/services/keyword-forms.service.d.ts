import type { IKeywordsRepository } from '../interfaces/keywords-repository.interface.js';
import { KeywordMorphologyService } from './keyword-morphology.service.js';
export declare class KeywordFormsService {
    private readonly repository;
    private readonly morphologyService;
    constructor(repository: IKeywordsRepository, morphologyService: KeywordMorphologyService);
    syncGeneratedForms(keywordId: number, word: string, isPhrase: boolean): Promise<void>;
    addManualForm(keywordId: number, form: string): Promise<void>;
    removeManualForm(keywordId: number, form: string): Promise<void>;
    excludeGeneratedForm(keywordId: number, form: string): Promise<void>;
    removeGeneratedFormExclusion(keywordId: number, form: string): Promise<void>;
}
