import { KeywordsService } from './keywords.service.js';
import { AddKeywordDto } from './dto/add-keyword.dto.js';
import { BulkAddKeywordsDto } from './dto/bulk-add-keywords.dto.js';
import { UpdateKeywordCategoryDto } from './dto/update-keyword-category.dto.js';
import { KeywordFormDto } from './dto/keyword-form.dto.js';
import { KeywordIdParamDto } from './dto/keyword-id-param.dto.js';
import { GetKeywordsQueryDto } from './dto/get-keywords-query.dto.js';
import { IKeywordResponse, IDeleteResponse, IBulkAddResponse, IKeywordFormsResponse } from './interfaces/keyword.interface.js';
export declare class KeywordsController {
    private readonly keywordsService;
    constructor(keywordsService: KeywordsService);
    addKeyword(dto: AddKeywordDto): Promise<IKeywordResponse>;
    bulkAddKeywords(dto: BulkAddKeywordsDto): Promise<IBulkAddResponse>;
    updateKeywordCategory(params: KeywordIdParamDto, dto: UpdateKeywordCategoryDto): Promise<IKeywordResponse>;
    uploadKeywords(file: Express.Multer.File): Promise<IBulkAddResponse>;
    getAllKeywords(query: GetKeywordsQueryDto): Promise<{
        keywords: IKeywordResponse[];
        total: number;
        page: number;
        limit: number;
    }>;
    deleteAllKeywords(): Promise<IDeleteResponse>;
    getKeywordForms(params: KeywordIdParamDto): Promise<IKeywordFormsResponse>;
    addManualKeywordForm(params: KeywordIdParamDto, dto: KeywordFormDto): Promise<IKeywordFormsResponse>;
    removeManualKeywordForm(params: KeywordIdParamDto, dto: KeywordFormDto): Promise<IKeywordFormsResponse>;
    addKeywordFormExclusion(params: KeywordIdParamDto, dto: KeywordFormDto): Promise<IKeywordFormsResponse>;
    removeKeywordFormExclusion(params: KeywordIdParamDto, dto: KeywordFormDto): Promise<IKeywordFormsResponse>;
    deleteKeyword(params: KeywordIdParamDto): Promise<IDeleteResponse>;
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
}
