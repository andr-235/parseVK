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
import { CommentsFilterBuilder } from '../builders/comments-filter.builder.js';
import { COMMENTS_REPOSITORY, } from '../interfaces/comments-repository.interface.js';
let CommentsStatsService = class CommentsStatsService {
    repository;
    filterBuilder;
    constructor(repository, filterBuilder) {
        this.repository = repository;
        this.filterBuilder = filterBuilder;
    }
    async calculateStats(baseFilters, readStatusFilter) {
        const baseWhere = this.filterBuilder.buildBaseWhere(baseFilters);
        const readStatusWhere = this.filterBuilder.buildReadStatusWhere(readStatusFilter);
        const totalWhere = this.filterBuilder.mergeWhere(baseWhere, readStatusWhere);
        const readWhere = this.filterBuilder.mergeWhere(baseWhere, {
            isRead: true,
        });
        const unreadWhere = this.filterBuilder.mergeWhere(baseWhere, {
            isRead: false,
        });
        const [total, readCount, unreadCount] = await Promise.all([
            this.repository.count({ where: totalWhere }),
            this.repository.count({ where: readWhere }),
            this.repository.count({ where: unreadWhere }),
        ]);
        return { total, readCount, unreadCount };
    }
    async calculateStatsWithAdditionalWhere(baseFilters, readStatusFilter, additionalWhere) {
        const baseWhere = this.filterBuilder.buildBaseWhere(baseFilters);
        const readStatusWhere = this.filterBuilder.buildReadStatusWhere(readStatusFilter);
        const totalWhere = this.filterBuilder.mergeWhere(baseWhere, readStatusWhere, additionalWhere);
        const readWhere = this.filterBuilder.mergeWhere(baseWhere, {
            isRead: true,
        });
        const unreadWhere = this.filterBuilder.mergeWhere(baseWhere, {
            isRead: false,
        });
        const [total, readCount, unreadCount] = await Promise.all([
            this.repository.count({ where: totalWhere }),
            this.repository.count({ where: readWhere }),
            this.repository.count({ where: unreadWhere }),
        ]);
        return { total, readCount, unreadCount };
    }
};
CommentsStatsService = __decorate([
    Injectable(),
    __param(0, Inject(COMMENTS_REPOSITORY)),
    __metadata("design:paramtypes", [Object, CommentsFilterBuilder])
], CommentsStatsService);
export { CommentsStatsService };
//# sourceMappingURL=comments-stats.service.js.map