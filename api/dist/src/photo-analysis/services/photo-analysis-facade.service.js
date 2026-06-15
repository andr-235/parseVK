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
import { PhotoAnalysisSummaryBuilder } from '../builders/photo-analysis-summary.builder.js';
let PhotoAnalysisFacadeService = class PhotoAnalysisFacadeService {
    repository;
    authorService;
    summaryBuilder;
    analyzeCommandHandler;
    constructor(repository, authorService, summaryBuilder, analyzeCommandHandler) {
        this.repository = repository;
        this.authorService = authorService;
        this.summaryBuilder = summaryBuilder;
        this.analyzeCommandHandler = analyzeCommandHandler;
    }
    async analyzeByVkUser(command) {
        return this.analyzeCommandHandler.execute(command);
    }
    async listByVkUser(vkUserId) {
        const author = await this.authorService.findAuthorByVkId(vkUserId);
        const analyses = await this.repository.findByAuthorId(author.id);
        const summary = this.summaryBuilder.reset().addItems(analyses).build();
        return {
            items: analyses,
            total: analyses.length,
            suspiciousCount: summary.suspicious,
            analyzedCount: analyses.length,
            summary,
        };
    }
    async listSuspiciousByVkUser(vkUserId) {
        const author = await this.authorService.findAuthorByVkId(vkUserId);
        const analyses = await this.repository.findSuspiciousByAuthorId(author.id);
        const summary = this.summaryBuilder.reset().addItems(analyses).build();
        return {
            items: analyses,
            total: analyses.length,
            suspiciousCount: summary.suspicious,
            analyzedCount: analyses.length,
            summary,
        };
    }
    async deleteByVkUser(vkUserId) {
        const author = await this.authorService.findAuthorByVkId(vkUserId);
        await this.repository.deleteByAuthorId(author.id);
    }
    async getSummaryByVkUser(vkUserId) {
        const { summary } = await this.listByVkUser(vkUserId);
        return summary;
    }
    async getSummariesByAuthorIds(authorIds) {
        if (!authorIds.length) {
            return new Map();
        }
        const analyses = await this.repository.findByAuthorIds(authorIds);
        const grouped = new Map();
        analyses.forEach((analysis) => {
            const list = grouped.get(analysis.authorId) ?? [];
            list.push(analysis);
            grouped.set(analysis.authorId, list);
        });
        const summaryMap = new Map();
        authorIds.forEach((authorId) => {
            const items = grouped.get(authorId) ?? [];
            const summary = this.summaryBuilder.reset().addItems(items).build();
            summaryMap.set(authorId, summary);
        });
        return summaryMap;
    }
    getEmptySummary() {
        return this.summaryBuilder.reset().build();
    }
};
PhotoAnalysisFacadeService = __decorate([
    Injectable(),
    __param(0, Inject('IPhotoAnalysisRepository')),
    __param(1, Inject('IAuthorService')),
    __param(3, Inject('IAnalyzePhotosCommandHandler')),
    __metadata("design:paramtypes", [Object, Object, PhotoAnalysisSummaryBuilder, Object])
], PhotoAnalysisFacadeService);
export { PhotoAnalysisFacadeService };
//# sourceMappingURL=photo-analysis-facade.service.js.map