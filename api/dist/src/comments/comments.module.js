var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller.js';
import { CommentsService } from './comments.service.js';
import { CommentsStatsService } from './services/comments-stats.service.js';
import { CommentsSearchModule } from '../comments-search/comments-search.module.js';
import { CommentsRepository } from './repositories/comments.repository.js';
import { CommentMapper } from './mappers/comment.mapper.js';
import { CommentsFilterBuilder } from './builders/comments-filter.builder.js';
import { OffsetPaginationStrategy } from './strategies/offset-pagination.strategy.js';
import { CursorPaginationStrategy } from './strategies/cursor-pagination.strategy.js';
import { CommentsQueryValidator } from './validators/comments-query.validator.js';
import { COMMENTS_REPOSITORY } from './interfaces/comments-repository.interface.js';
const PAGINATION_STRATEGIES = [
    OffsetPaginationStrategy,
    CursorPaginationStrategy,
];
const COMMENTS_PROVIDERS = [
    CommentsService,
    CommentsStatsService,
    CommentMapper,
    CommentsFilterBuilder,
    CommentsQueryValidator,
];
let CommentsModule = class CommentsModule {
};
CommentsModule = __decorate([
    Module({
        imports: [CommentsSearchModule],
        controllers: [CommentsController],
        providers: [
            ...COMMENTS_PROVIDERS,
            ...PAGINATION_STRATEGIES,
            {
                provide: COMMENTS_REPOSITORY,
                useClass: CommentsRepository,
            },
        ],
        exports: [CommentsService],
    })
], CommentsModule);
export { CommentsModule };
//# sourceMappingURL=comments.module.js.map