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
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PhotoAnalysisService } from '../photo-analysis/photo-analysis.service.js';
import { AuthorsSaverService } from '../common/services/authors-saver.service.js';
import { AUTHORS_CONSTANTS, AUTHORS_REPOSITORY, SORTABLE_FIELDS, } from './authors.constants.js';
import { AuthorFiltersBuilder } from './builders/author-filters.builder.js';
import { AuthorMapper } from './mappers/author.mapper.js';
let AuthorsService = class AuthorsService {
    repository;
    photoAnalysisService;
    authorsSaver;
    filtersBuilder = new AuthorFiltersBuilder();
    constructor(repository, photoAnalysisService, authorsSaver) {
        this.repository = repository;
        this.photoAnalysisService = photoAnalysisService;
        this.authorsSaver = authorsSaver;
    }
    async listAuthors(options = {}) {
        const { offset, limit, search, city, verified, sort } = this.normalizeListOptions(options);
        const { sqlConditions } = this.filtersBuilder.buildFilters(search, city, verified);
        const [total, authors] = await Promise.all([
            this.repository.countByFilters(sqlConditions),
            this.repository.findByFilters({
                sqlConditions,
                offset,
                limit,
                sort,
            }),
        ]);
        const authorIds = authors.map((author) => author.id);
        const summaryMap = authorIds.length > 0
            ? await this.photoAnalysisService.getSummariesByAuthorIds(authorIds)
            : new Map();
        const items = authors.map((author) => AuthorMapper.toCardDto(author, summaryMap.get(author.id)));
        return {
            items,
            total,
            hasMore: offset + limit < total,
        };
    }
    async getAuthorDetails(vkUserId) {
        const author = await this.getAuthorOrThrow(vkUserId);
        const summaries = await this.photoAnalysisService.getSummariesByAuthorIds([
            author.id,
        ]);
        const summary = summaries.get(author.id);
        return AuthorMapper.toDetailsDto(author, summary);
    }
    async refreshAuthors() {
        return this.authorsSaver.refreshAllAuthors();
    }
    async deleteAuthor(vkUserId) {
        await this.getAuthorOrThrow(vkUserId);
        await this.repository.deleteAuthorAndComments(vkUserId);
    }
    async markAuthorVerified(vkUserId) {
        const author = await this.getAuthorOrThrow(vkUserId);
        if (author.verifiedAt) {
            return { verifiedAt: author.verifiedAt.toISOString() };
        }
        const verifiedAt = await this.repository.markAuthorVerified(vkUserId, new Date());
        return { verifiedAt: verifiedAt.toISOString() };
    }
    async getAuthorOrThrow(vkUserId) {
        const author = await this.repository.findUnique({ vkUserId });
        if (!author) {
            throw new NotFoundException(`Автор с VK ID ${vkUserId} не найден`);
        }
        return author;
    }
    normalizeListOptions(options) {
        const offset = this.normalizeOffset(options.offset);
        const limit = this.normalizeLimit(options.limit);
        const search = this.normalizeSearch(options.search);
        const city = this.normalizeSearch(options.city);
        const verified = options.verified;
        const sort = this.resolveSort(options.sortBy, options.sortOrder ?? null, verified);
        return { offset, limit, search, city, verified, sort };
    }
    normalizeOffset(value) {
        return Math.max(value ?? 0, 0);
    }
    normalizeLimit(value) {
        return Math.min(Math.max(value ?? AUTHORS_CONSTANTS.DEFAULT_LIMIT, 1), AUTHORS_CONSTANTS.MAX_LIMIT);
    }
    normalizeSearch(value) {
        return value?.trim() || undefined;
    }
    normalizeSortOrder(value) {
        return value === 'asc' || value === 'desc' ? value : 'desc';
    }
    normalizeSortField(value) {
        if (!value) {
            return null;
        }
        return SORTABLE_FIELDS.has(value) ? value : null;
    }
    resolveSort(sortBy, sortOrder, verified) {
        const normalizedField = this.normalizeSortField(sortBy);
        if (normalizedField) {
            return {
                field: normalizedField,
                order: this.normalizeSortOrder(sortOrder),
            };
        }
        if (verified === true) {
            return {
                field: 'verifiedAt',
                order: 'desc',
            };
        }
        return {
            field: 'updatedAt',
            order: 'desc',
        };
    }
};
AuthorsService = __decorate([
    Injectable(),
    __param(0, Inject(AUTHORS_REPOSITORY)),
    __metadata("design:paramtypes", [Object, PhotoAnalysisService,
        AuthorsSaverService])
], AuthorsService);
export { AuthorsService };
//# sourceMappingURL=authors.service.js.map