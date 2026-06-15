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
import { PhotoAnalysisService } from '../../photo-analysis/photo-analysis.service.js';
let WatchlistStatsCollectorService = class WatchlistStatsCollectorService {
    repository;
    photoAnalysisService;
    constructor(repository, photoAnalysisService) {
        this.repository = repository;
        this.photoAnalysisService = photoAnalysisService;
    }
    async collectCommentCounts(authorIds) {
        return this.repository.countCommentsByAuthorIds(authorIds);
    }
    async collectAnalysisSummaries(records) {
        const authorIds = Array.from(new Set(records
            .map((record) => record.author?.id)
            .filter((id) => typeof id === 'number')));
        if (!authorIds.length) {
            return new Map();
        }
        return this.photoAnalysisService.getSummariesByAuthorIds(authorIds);
    }
    resolveSummary(record, summaryMap) {
        const authorId = record.author?.id;
        if (typeof authorId !== 'number') {
            return this.cloneSummary(this.photoAnalysisService.getEmptySummary());
        }
        const summary = summaryMap.get(authorId);
        if (!summary) {
            return this.cloneSummary(this.photoAnalysisService.getEmptySummary());
        }
        return this.cloneSummary(summary);
    }
    cloneSummary(summary) {
        return {
            total: summary.total,
            suspicious: summary.suspicious,
            lastAnalyzedAt: summary.lastAnalyzedAt,
            categories: summary.categories.map((item) => ({ ...item })),
            levels: summary.levels.map((item) => ({ ...item })),
        };
    }
};
WatchlistStatsCollectorService = __decorate([
    Injectable(),
    __param(0, Inject('IWatchlistRepository')),
    __metadata("design:paramtypes", [Object, PhotoAnalysisService])
], WatchlistStatsCollectorService);
export { WatchlistStatsCollectorService };
//# sourceMappingURL=watchlist-stats-collector.service.js.map