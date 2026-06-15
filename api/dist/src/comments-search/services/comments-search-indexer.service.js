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
var CommentsSearchIndexerService_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { COMMENTS_SEARCH_CLIENT, COMMENTS_SEARCH_CONFIG, } from '../comments-search.constants.js';
import { CommentsSearchDocumentMapper } from '../mappers/comments-search-document.mapper.js';
const indexCommentInclude = {
    author: {
        select: {
            firstName: true,
            lastName: true,
        },
    },
    post: {
        select: {
            text: true,
            group: {
                select: {
                    vkId: true,
                    name: true,
                },
            },
        },
    },
    commentKeywordMatches: {
        include: {
            keyword: {
                select: {
                    id: true,
                    word: true,
                },
            },
        },
    },
};
let CommentsSearchIndexerService = CommentsSearchIndexerService_1 = class CommentsSearchIndexerService {
    config;
    prisma;
    client;
    mapper;
    logger = new Logger(CommentsSearchIndexerService_1.name);
    constructor(config, prisma, client, mapper) {
        this.config = config;
        this.prisma = prisma;
        this.client = client;
        this.mapper = mapper;
    }
    async indexCommentById(commentId) {
        if (!this.config.enabled) {
            return;
        }
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
            include: indexCommentInclude,
        });
        if (!comment) {
            this.logger.warn(`Comment ${commentId} not found for search indexing`);
            return;
        }
        await this.client.indexDocument(String(comment.id), this.mapper.map(comment));
    }
    async indexCommentsByPost(ownerId, postId) {
        if (!this.config.enabled) {
            return;
        }
        const comments = await this.prisma.comment.findMany({
            where: { ownerId, postId },
            select: { id: true },
        });
        for (const comment of comments) {
            await this.indexCommentById(comment.id);
        }
    }
};
CommentsSearchIndexerService = CommentsSearchIndexerService_1 = __decorate([
    Injectable(),
    __param(0, Inject(COMMENTS_SEARCH_CONFIG)),
    __param(2, Inject(COMMENTS_SEARCH_CLIENT)),
    __metadata("design:paramtypes", [Object, PrismaService, Object, CommentsSearchDocumentMapper])
], CommentsSearchIndexerService);
export { CommentsSearchIndexerService };
//# sourceMappingURL=comments-search-indexer.service.js.map