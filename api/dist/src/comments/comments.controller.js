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
import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Patch, Post, Query, } from '@nestjs/common';
import { DEFAULT_LIMIT } from './constants/comments.constants.js';
import { CommentsService } from './comments.service.js';
import { CommentsSearchService } from '../comments-search/comments-search.service.js';
import { UpdateCommentReadDto } from './dto/update-comment-read.dto.js';
import { CommentsQueryValidator } from './validators/comments-query.validator.js';
let CommentsController = class CommentsController {
    commentsService;
    commentsSearchService;
    queryValidator;
    constructor(commentsService, commentsSearchService, queryValidator) {
        this.commentsService = commentsService;
        this.commentsSearchService = commentsSearchService;
        this.queryValidator = queryValidator;
    }
    async getComments(offset, limit, keywordsParam, keywordSourceParam, readStatusParam, search) {
        const normalizedOffset = this.queryValidator.normalizeOffset(offset);
        const normalizedLimit = this.queryValidator.normalizeLimit(limit);
        const keywords = this.queryValidator.parseKeywords(keywordsParam);
        const keywordSource = this.queryValidator.normalizeKeywordSource(keywordSourceParam);
        const readStatus = this.queryValidator.normalizeReadStatus(readStatusParam);
        const normalizedSearch = this.queryValidator.normalizeSearch(search);
        return this.commentsService.getComments({
            offset: normalizedOffset,
            limit: normalizedLimit,
            keywords,
            keywordSource,
            readStatus,
            search: normalizedSearch,
        });
    }
    async getCommentsCursor(cursor, limit, keywordsParam, keywordSourceParam, readStatusParam, search) {
        const normalizedLimit = this.queryValidator.normalizeLimitWithDefault(limit);
        const keywords = this.queryValidator.parseKeywords(keywordsParam);
        const keywordSource = this.queryValidator.normalizeKeywordSource(keywordSourceParam);
        const readStatus = this.queryValidator.normalizeReadStatus(readStatusParam);
        const normalizedSearch = this.queryValidator.normalizeSearch(search);
        return this.commentsService.getCommentsCursor({
            cursor,
            limit: normalizedLimit,
            keywords,
            keywordSource,
            readStatus,
            search: normalizedSearch,
        });
    }
    async updateReadStatus(id, { isRead }) {
        return this.commentsService.setReadStatus(id, isRead);
    }
    searchComments(payload) {
        return this.commentsSearchService.search(payload);
    }
};
__decorate([
    Get(),
    __param(0, Query('offset', new DefaultValuePipe(0), ParseIntPipe)),
    __param(1, Query('limit', new DefaultValuePipe(DEFAULT_LIMIT), ParseIntPipe)),
    __param(2, Query('keywords')),
    __param(3, Query('keywordSource')),
    __param(4, Query('readStatus')),
    __param(5, Query('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "getComments", null);
__decorate([
    Get('cursor'),
    __param(0, Query('cursor')),
    __param(1, Query('limit', new DefaultValuePipe(DEFAULT_LIMIT), ParseIntPipe)),
    __param(2, Query('keywords')),
    __param(3, Query('keywordSource')),
    __param(4, Query('readStatus')),
    __param(5, Query('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "getCommentsCursor", null);
__decorate([
    Patch(':id/read'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, UpdateCommentReadDto]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "updateReadStatus", null);
__decorate([
    Post('search'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "searchComments", null);
CommentsController = __decorate([
    Controller('comments'),
    __metadata("design:paramtypes", [CommentsService,
        CommentsSearchService,
        CommentsQueryValidator])
], CommentsController);
export { CommentsController };
//# sourceMappingURL=comments.controller.js.map