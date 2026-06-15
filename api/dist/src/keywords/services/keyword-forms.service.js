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
import { Inject, Injectable } from '@nestjs/common';
import { normalizeForKeywordMatch } from '../../common/utils/keyword-normalization.utils.js';
import { KeywordMorphologyService } from './keyword-morphology.service.js';
let KeywordFormsService = class KeywordFormsService {
    repository;
    morphologyService;
    constructor(repository, morphologyService) {
        this.repository = repository;
        this.morphologyService = morphologyService;
    }
    async syncGeneratedForms(keywordId, word, isPhrase) {
        const keyword = await this.repository.findUniqueWithForms({
            id: keywordId,
        });
        const generatedForms = await this.morphologyService.generateForms(word, isPhrase);
        const excludedForms = new Set(keyword.keywordFormExclusions
            .map((exclusion) => normalizeForKeywordMatch(exclusion.form))
            .filter(Boolean));
        const formsToPersist = Array.from(new Set(generatedForms
            .map((form) => normalizeForKeywordMatch(form))
            .filter((form) => Boolean(form))
            .filter((form) => !excludedForms.has(form))));
        await this.repository.replaceGeneratedForms(keywordId, formsToPersist);
    }
    async addManualForm(keywordId, form) {
        const normalizedForm = normalizeForKeywordMatch(form);
        if (!normalizedForm) {
            return;
        }
        await this.repository.addManualForm(keywordId, normalizedForm);
    }
    async removeManualForm(keywordId, form) {
        const normalizedForm = normalizeForKeywordMatch(form);
        if (!normalizedForm) {
            return;
        }
        await this.repository.removeManualForm(keywordId, normalizedForm);
    }
    async excludeGeneratedForm(keywordId, form) {
        const normalizedForm = normalizeForKeywordMatch(form);
        if (!normalizedForm) {
            return;
        }
        await this.repository.excludeGeneratedForm(keywordId, normalizedForm);
    }
    async removeGeneratedFormExclusion(keywordId, form) {
        const normalizedForm = normalizeForKeywordMatch(form);
        if (!normalizedForm) {
            return;
        }
        await this.repository.removeGeneratedFormExclusion(keywordId, normalizedForm);
    }
};
KeywordFormsService = __decorate([
    Injectable(),
    __param(0, Inject('IKeywordsRepository')),
    __metadata("design:paramtypes", [Object, KeywordMorphologyService])
], KeywordFormsService);
export { KeywordFormsService };
//# sourceMappingURL=keyword-forms.service.js.map