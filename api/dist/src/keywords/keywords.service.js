var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { KeywordFormSource, } from '../generated/prisma/client.js';
import { normalizeForKeywordMatch } from '../common/utils/keyword-normalization.utils.js';
import { KeywordFormsService } from './services/keyword-forms.service.js';
import { KeywordsMatchesService } from './services/keywords-matches.service.js';
let KeywordsService = class KeywordsService {
    repository;
    matchesService;
    formsService;
    constructor(repository, matchesService, formsService) {
        this.repository = repository;
        this.matchesService = matchesService;
        this.formsService = formsService;
    }
    async addKeyword(word, category, isPhrase) {
        const normalizedWord = word.trim().toLowerCase();
        const normalizedCategory = category?.trim() ?? null;
        if (!normalizedWord) {
            throw new Error('Keyword cannot be empty');
        }
        let existing = null;
        try {
            existing = (await this.repository.findUnique({
                word: normalizedWord,
            }));
        }
        catch (error) {
            if (typeof error === 'object' &&
                error !== null &&
                'code' in error &&
                error.code === 'P2025') {
                existing = null;
            }
            else {
                throw error;
            }
        }
        if (existing) {
            const updated = (await this.repository.update({ id: existing.id }, {
                category: normalizedCategory,
                isPhrase: isPhrase ?? existing.isPhrase ?? false,
            }));
            await this.formsService.syncGeneratedForms(updated.id, updated.word, updated.isPhrase);
            await this.matchesService.recalculateKeywordMatchesForKeyword(updated.id);
            return updated;
        }
        const created = (await this.repository.create({
            word: normalizedWord,
            category: normalizedCategory,
            isPhrase: isPhrase ?? false,
        }));
        await this.formsService.syncGeneratedForms(created.id, created.word, created.isPhrase);
        await this.matchesService.recalculateKeywordMatchesForKeyword(created.id);
        return created;
    }
    async updateKeywordCategory(id, category) {
        await this.repository.findUniqueById({ id });
        const normalizedCategory = category?.trim() ?? null;
        return (await this.repository.update({ id }, { category: normalizedCategory }));
    }
    async bulkAddKeywords(words) {
        const entries = words.map((word) => ({
            word: word.trim(),
            category: null,
        }));
        return this.bulkAddKeywordEntries(entries);
    }
    async addKeywordsFromFile(fileContent) {
        const entries = fileContent
            .split('\n')
            .map((line) => {
            const parts = line.split(';').map((p) => p.trim());
            if (parts.length === 0 || !parts[0]) {
                return null;
            }
            if (parts.length === 1) {
                return { word: parts[0] };
            }
            return { word: parts[0], category: parts[1] };
        })
            .filter((entry) => entry !== null);
        return this.bulkAddKeywordEntries(entries);
    }
    async bulkAddKeywordEntries(entries) {
        const success = [];
        const failed = [];
        const normalizedWords = Array.from(new Set(entries
            .map((entry) => entry.word?.trim().toLowerCase())
            .filter((word) => Boolean(word))));
        const existingKeywords = normalizedWords.length
            ? ((await this.repository.findMany({
                word: { in: normalizedWords },
            })) ?? [])
            : [];
        const existedBeforeImport = new Set(existingKeywords.map((keyword) => keyword.word));
        const processedInBatch = new Set();
        let createdCount = 0;
        let updatedCount = 0;
        for (const { word, category } of entries) {
            const normalizedWord = word.trim().toLowerCase();
            try {
                const keyword = await this.addKeyword(word, category ?? undefined);
                success.push(keyword);
                if (existedBeforeImport.has(normalizedWord) ||
                    processedInBatch.has(normalizedWord)) {
                    updatedCount += 1;
                }
                else {
                    createdCount += 1;
                }
                processedInBatch.add(normalizedWord);
            }
            catch (error) {
                failed.push({
                    word,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        return {
            success,
            failed,
            stats: {
                total: entries.length,
                success: success.length,
                failed: failed.length,
                created: createdCount,
                updated: updatedCount,
            },
        };
    }
    async deleteKeyword(id) {
        await this.repository.delete({ id });
        return { success: true, id };
    }
    async deleteAllKeywords() {
        const result = await this.repository.deleteMany();
        return { success: true, count: result.count };
    }
    async getAllKeywords() {
        return this.getKeywords();
    }
    async getKeywords(options) {
        const page = options?.page ?? 1;
        const limit = options?.limit ?? 50;
        const skip = (page - 1) * limit;
        const search = options?.search;
        const orderBy = { word: 'asc' };
        const where = search
            ? {
                OR: [
                    { word: { contains: search, mode: 'insensitive' } },
                    { category: { contains: search, mode: 'insensitive' } },
                ],
            }
            : undefined;
        const [keywords, total] = await Promise.all([
            this.repository.findMany(where, orderBy, skip, limit),
            this.repository.count(where),
        ]);
        return {
            keywords,
            total,
            page,
            limit,
        };
    }
    async getKeywordWords() {
        const keywords = await this.repository.findManyWithSelect({
            id: true,
            word: true,
            isPhrase: true,
        });
        const normalized = keywords
            .map((keyword) => keyword.word.trim())
            .filter((value) => value.length > 0);
        return Array.from(new Set(normalized));
    }
    async getKeywordForms(id) {
        const keyword = await this.repository.findUniqueWithForms({ id });
        return {
            keywordId: keyword.id,
            word: keyword.word,
            isPhrase: keyword.isPhrase,
            generatedForms: this.collectFormsBySource(keyword.keywordForms, KeywordFormSource.generated),
            manualForms: this.collectFormsBySource(keyword.keywordForms, KeywordFormSource.manual),
            exclusions: Array.from(new Set(keyword.keywordFormExclusions.map((item) => item.form))).sort((left, right) => left.localeCompare(right, 'ru')),
        };
    }
    async addManualKeywordForm(id, form) {
        const keyword = await this.repository.findUniqueWithForms({ id });
        this.ensureSingleWordKeyword(keyword.isPhrase);
        this.ensureNormalizedForm(form);
        await this.formsService.addManualForm(id, form);
        await this.matchesService.recalculateKeywordMatchesForKeyword(id);
        return this.getKeywordForms(id);
    }
    async removeManualKeywordForm(id, form) {
        const keyword = await this.repository.findUniqueWithForms({ id });
        this.ensureSingleWordKeyword(keyword.isPhrase);
        this.ensureNormalizedForm(form);
        await this.formsService.removeManualForm(id, form);
        await this.matchesService.recalculateKeywordMatchesForKeyword(id);
        return this.getKeywordForms(id);
    }
    async addKeywordFormExclusion(id, form) {
        const keyword = await this.repository.findUniqueWithForms({ id });
        this.ensureSingleWordKeyword(keyword.isPhrase);
        this.ensureNormalizedForm(form);
        await this.formsService.excludeGeneratedForm(id, form);
        await this.formsService.syncGeneratedForms(id, keyword.word, keyword.isPhrase);
        await this.matchesService.recalculateKeywordMatchesForKeyword(id);
        return this.getKeywordForms(id);
    }
    async removeKeywordFormExclusion(id, form) {
        const keyword = await this.repository.findUniqueWithForms({ id });
        this.ensureSingleWordKeyword(keyword.isPhrase);
        this.ensureNormalizedForm(form);
        await this.formsService.removeGeneratedFormExclusion(id, form);
        await this.formsService.syncGeneratedForms(id, keyword.word, keyword.isPhrase);
        await this.matchesService.recalculateKeywordMatchesForKeyword(id);
        return this.getKeywordForms(id);
    }
    async recalculateKeywordMatches() {
        return this.matchesService.recalculateKeywordMatches();
    }
    async rebuildKeywordForms() {
        const keywords = await this.repository.findManyWithSelect({
            id: true,
            word: true,
            isPhrase: true,
        });
        for (const keyword of keywords) {
            await this.formsService.syncGeneratedForms(keyword.id, keyword.word, keyword.isPhrase);
        }
        const matches = await this.matchesService.recalculateKeywordMatches();
        return {
            keywordsRebuilt: keywords.length,
            ...matches,
        };
    }
    ensureSingleWordKeyword(isPhrase) {
        if (isPhrase) {
            throw new BadRequestException('Manual forms and exclusions are available only for single-word keywords');
        }
    }
    ensureNormalizedForm(form) {
        const normalizedForm = normalizeForKeywordMatch(form);
        if (!normalizedForm) {
            throw new BadRequestException('Keyword form cannot be empty');
        }
        return normalizedForm;
    }
    collectFormsBySource(forms, source) {
        return Array.from(new Set(forms.filter((form) => form.source === source).map((form) => form.form))).sort((left, right) => left.localeCompare(right, 'ru'));
    }
};
KeywordsService = __decorate([
    Injectable(),
    __param(0, Inject('IKeywordsRepository')),
    __metadata("design:paramtypes", [Object, KeywordsMatchesService,
        KeywordFormsService])
], KeywordsService);
export { KeywordsService };
//# sourceMappingURL=keywords.service.js.map