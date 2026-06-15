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
import { COMMENTS_SEARCH_CLIENT, COMMENTS_SEARCH_CONFIG, } from './comments-search.constants.js';
import { CommentsSearchQueryBuilder } from './builders/comments-search-query.builder.js';
import { CommentsSearchResponseMapper, } from './mappers/comments-search-response.mapper.js';
let CommentsSearchService = class CommentsSearchService {
    config;
    client;
    queryBuilder;
    responseMapper;
    constructor(config, client, queryBuilder, responseMapper) {
        this.config = config;
        this.client = client;
        this.queryBuilder = queryBuilder;
        this.responseMapper = responseMapper;
    }
    async search(payload) {
        const page = payload.page ?? 1;
        const pageSize = payload.pageSize ?? 20;
        if (!this.config.enabled) {
            return {
                source: 'fallback',
                viewMode: payload.viewMode,
                total: 0,
                page,
                pageSize,
                items: [],
            };
        }
        const response = await this.client.search(this.queryBuilder.build(payload));
        return this.responseMapper.map({
            payload: {
                ...payload,
                page,
                pageSize,
            },
            response,
        });
    }
};
CommentsSearchService = __decorate([
    Injectable(),
    __param(0, Inject(COMMENTS_SEARCH_CONFIG)),
    __param(1, Inject(COMMENTS_SEARCH_CLIENT)),
    __metadata("design:paramtypes", [Object, Object, CommentsSearchQueryBuilder,
        CommentsSearchResponseMapper])
], CommentsSearchService);
export { CommentsSearchService };
//# sourceMappingURL=comments-search.service.js.map