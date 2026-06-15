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
import { CommentMapper } from './mappers/comment.mapper.js';
import { CursorPaginationStrategy } from './strategies/cursor-pagination.strategy.js';
import { OffsetPaginationStrategy } from './strategies/offset-pagination.strategy.js';
import { COMMENTS_REPOSITORY, } from './interfaces/comments-repository.interface.js';
let CommentsService = class CommentsService {
    repository;
    offsetStrategy;
    cursorStrategy;
    mapper;
    constructor(repository, offsetStrategy, cursorStrategy, mapper) {
        this.repository = repository;
        this.offsetStrategy = offsetStrategy;
        this.cursorStrategy = cursorStrategy;
        this.mapper = mapper;
    }
    async getComments(options) {
        const { offset, limit, ...filters } = options;
        return this.offsetStrategy.execute(filters, { offset, limit });
    }
    async getCommentsCursor(options) {
        const { cursor, limit, ...filters } = options;
        return this.cursorStrategy.execute(filters, { cursor, limit });
    }
    async setReadStatus(id, isRead) {
        const comment = await this.repository.update({
            where: { id },
            data: { isRead },
        });
        return this.mapper.map(comment);
    }
};
CommentsService = __decorate([
    Injectable(),
    __param(0, Inject(COMMENTS_REPOSITORY)),
    __metadata("design:paramtypes", [Object, OffsetPaginationStrategy,
        CursorPaginationStrategy,
        CommentMapper])
], CommentsService);
export { CommentsService };
//# sourceMappingURL=comments.service.js.map