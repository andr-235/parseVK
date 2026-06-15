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
var CommentsSaverService_1;
import { Injectable, Logger, Optional } from '@nestjs/common';
import { CommentSource } from '../types/comment-source.enum.js';
import { MatchSource } from '../types/match-source.enum.js';
import { PrismaService } from '../../prisma.service.js';
import { CommentsSearchIndexerService } from '../../comments-search/services/comments-search-indexer.service.js';
import { buildKeywordMatchCandidates, normalizeForKeywordMatch, matchesKeyword, } from '../utils/keyword-normalization.utils.js';
import { toUpdateJsonValue } from '../utils/prisma-json.utils.js';
let CommentsSaverService = CommentsSaverService_1 = class CommentsSaverService {
    prisma;
    searchIndexer;
    logger = new Logger(CommentsSaverService_1.name);
    constructor(prisma, searchIndexer) {
        this.prisma = prisma;
        this.searchIndexer = searchIndexer;
    }
    async saveComments(comments, options) {
        if (!comments.length) {
            return 0;
        }
        const keywordMatches = options.keywordMatches ?? (await this.loadKeywordMatchCandidates());
        const saveOptions = { ...options, keywordMatches };
        this.logger.debug(`[saveComments] Сохраняем ${comments.length} комментариев, source=${options.source}`, { keywordCandidates: keywordMatches.length });
        let saved = 0;
        for (const comment of comments) {
            saved += await this.saveComment(comment, saveOptions);
        }
        this.logger.debug(`[saveComments] Сохранено: ${saved}`);
        return saved;
    }
    async saveComment(comment, options) {
        const jsonFields = this.buildCommentJsonFields(comment);
        const updateData = this.buildCommentUpdateData(comment, jsonFields, options);
        const createData = this.buildCommentCreateData(comment, jsonFields, options);
        const savedComment = await this.prisma.comment.upsert({
            where: {
                ownerId_vkCommentId: {
                    ownerId: comment.ownerId,
                    vkCommentId: comment.vkCommentId,
                },
            },
            update: updateData,
            create: createData,
        });
        await this.syncCommentKeywordMatches(savedComment.id, comment.text, options.keywordMatches ?? [], MatchSource.COMMENT);
        await this.syncPostKeywordMatches(comment.ownerId, comment.postId, options.keywordMatches ?? []);
        await this.searchIndexer?.indexCommentById(savedComment.id);
        await this.searchIndexer?.indexCommentsByPost(comment.ownerId, comment.postId);
        let saved = 1;
        if (comment.threadItems?.length) {
            saved += await this.saveComments(comment.threadItems, options);
        }
        return saved;
    }
    buildCommentJsonFields(comment) {
        const threadItemsJson = toUpdateJsonValue(comment.threadItems?.length
            ? comment.threadItems.map((item) => this.serializeComment(item))
            : null);
        const attachmentsJson = toUpdateJsonValue(comment.attachments);
        const parentsStackJson = toUpdateJsonValue(comment.parentsStack);
        return {
            threadItems: threadItemsJson,
            attachments: attachmentsJson,
            parentsStack: parentsStackJson,
        };
    }
    buildCommentBaseFields(comment, jsonFields) {
        return {
            postId: comment.postId,
            ownerId: comment.ownerId,
            vkCommentId: comment.vkCommentId,
            fromId: comment.fromId,
            text: comment.text,
            publishedAt: comment.publishedAt,
            likesCount: comment.likesCount,
            parentsStack: jsonFields.parentsStack,
            threadCount: comment.threadCount,
            threadItems: jsonFields.threadItems,
            replyToUser: comment.replyToUser,
            replyToComment: comment.replyToComment,
            isDeleted: comment.isDeleted,
            ...(jsonFields.attachments !== undefined && {
                attachments: jsonFields.attachments,
            }),
        };
    }
    buildCommentUpdateData(comment, jsonFields, options) {
        const authorVkId = comment.fromId > 0 ? comment.fromId : null;
        return {
            ...this.buildCommentBaseFields(comment, jsonFields),
            authorVkId,
            ...(options.watchlistAuthorId !== undefined && {
                watchlistAuthorId: options.watchlistAuthorId ?? null,
            }),
            ...(options.source === CommentSource.WATCHLIST && {
                source: CommentSource.WATCHLIST,
            }),
        };
    }
    buildCommentCreateData(comment, jsonFields, options) {
        const authorVkId = comment.fromId > 0 ? comment.fromId : null;
        return {
            ...this.buildCommentBaseFields(comment, jsonFields),
            authorVkId: authorVkId ?? undefined,
            source: options.source,
            watchlistAuthorId: options.watchlistAuthorId ?? null,
        };
    }
    serializeComment(comment) {
        return {
            vkCommentId: comment.vkCommentId,
            ownerId: comment.ownerId,
            postId: comment.postId,
            fromId: comment.fromId,
            text: comment.text,
            publishedAt: comment.publishedAt.toISOString(),
            likesCount: comment.likesCount ?? null,
            parentsStack: comment.parentsStack ?? null,
            threadCount: comment.threadCount ?? null,
            threadItems: comment.threadItems?.length
                ? comment.threadItems.map((item) => this.serializeComment(item))
                : null,
            attachments: comment.attachments ?? null,
            replyToUser: comment.replyToUser ?? null,
            replyToComment: comment.replyToComment ?? null,
            isDeleted: comment.isDeleted,
        };
    }
    async loadKeywordMatchCandidates() {
        const keywords = await this.prisma.keyword.findMany({
            select: {
                id: true,
                word: true,
                isPhrase: true,
                keywordForms: {
                    select: {
                        form: true,
                    },
                },
            },
        });
        return buildKeywordMatchCandidates(keywords);
    }
    async syncCommentKeywordMatches(commentId, text, keywordMatches, source = MatchSource.COMMENT) {
        const normalizedText = normalizeForKeywordMatch(text);
        if (!normalizedText || !keywordMatches.length) {
            await this.deleteCommentKeywordMatches(commentId, source);
            return;
        }
        const matchedKeywordIds = this.findMatchedKeywordIdsInText(normalizedText, keywordMatches);
        const { toCreate, toDelete } = await this.calculateKeywordMatchDiff(commentId, matchedKeywordIds, source);
        if (toCreate.length === 0 && toDelete.length === 0) {
            return;
        }
        await this.applyKeywordMatchChanges(commentId, toCreate, toDelete, source);
    }
    async deleteCommentKeywordMatches(commentId, source) {
        await this.prisma.commentKeywordMatch.deleteMany({
            where: { commentId, source },
        });
    }
    findMatchedKeywordIdsInText(normalizedText, keywordMatches) {
        return new Set(keywordMatches
            .filter((keyword) => matchesKeyword(normalizedText, keyword))
            .map((keyword) => keyword.id));
    }
    async calculateKeywordMatchDiff(commentId, matchedKeywordIds, source) {
        const existingMatches = await this.prisma.commentKeywordMatch.findMany({
            where: { commentId, source },
            select: { keywordId: true },
        });
        const existingKeywordIds = new Set(existingMatches.map((match) => match.keywordId));
        const toCreate = Array.from(matchedKeywordIds).filter((keywordId) => !existingKeywordIds.has(keywordId));
        const toDelete = Array.from(existingKeywordIds).filter((keywordId) => !matchedKeywordIds.has(keywordId));
        return { toCreate, toDelete };
    }
    async applyKeywordMatchChanges(commentId, toCreate, toDelete, source) {
        if (toDelete.length === 0 && toCreate.length === 0) {
            return;
        }
        await this.prisma.$transaction(async (tx) => {
            if (toDelete.length > 0) {
                await tx.commentKeywordMatch.deleteMany({
                    where: { commentId, source, keywordId: { in: toDelete } },
                });
            }
            if (toCreate.length > 0) {
                await tx.commentKeywordMatch.createMany({
                    data: toCreate.map((keywordId) => ({ commentId, keywordId, source })),
                    skipDuplicates: true,
                });
            }
        });
    }
    async syncPostKeywordMatches(ownerId, postId, keywordMatches) {
        const post = await this.prisma.post.findUnique({
            where: { ownerId_vkPostId: { ownerId, vkPostId: postId } },
            select: { text: true },
        });
        if (!post?.text) {
            return;
        }
        const normalizedPostText = normalizeForKeywordMatch(post.text);
        const matchedKeywordIds = normalizedPostText
            ? this.findMatchedKeywordIdsInText(normalizedPostText, keywordMatches)
            : new Set();
        const comments = await this.prisma.comment.findMany({
            where: { ownerId, postId },
            select: { id: true },
        });
        if (comments.length === 0) {
            return;
        }
        const commentIds = comments.map((c) => c.id);
        if (matchedKeywordIds.size === 0) {
            await this.deleteAllPostKeywordMatches(commentIds);
            return;
        }
        const { toCreate, toDelete } = await this.calculatePostKeywordMatchDiff(commentIds, matchedKeywordIds);
        await this.applyPostKeywordMatchChanges(toCreate, toDelete);
    }
    async deleteAllPostKeywordMatches(commentIds) {
        if (commentIds.length === 0) {
            return;
        }
        await this.prisma.commentKeywordMatch.deleteMany({
            where: { commentId: { in: commentIds }, source: MatchSource.POST },
        });
    }
    async calculatePostKeywordMatchDiff(commentIds, matchedKeywordIds) {
        const existingMatches = await this.prisma.commentKeywordMatch.findMany({
            where: { commentId: { in: commentIds }, source: MatchSource.POST },
            select: { commentId: true, keywordId: true },
        });
        const existingKeys = new Set(existingMatches.map((m) => `${m.commentId}-${m.keywordId}`));
        const toCreate = [];
        for (const commentId of commentIds) {
            for (const keywordId of matchedKeywordIds) {
                if (!existingKeys.has(`${commentId}-${keywordId}`)) {
                    toCreate.push({ commentId, keywordId });
                }
            }
        }
        const toDelete = existingMatches
            .filter((match) => !matchedKeywordIds.has(match.keywordId))
            .map((match) => ({
            commentId: match.commentId,
            keywordId: match.keywordId,
        }));
        return { toCreate, toDelete };
    }
    async applyPostKeywordMatchChanges(toCreate, toDelete) {
        if (toCreate.length === 0 && toDelete.length === 0) {
            return;
        }
        await this.prisma.$transaction(async (tx) => {
            if (toDelete.length > 0) {
                for (const { commentId, keywordId } of toDelete) {
                    await tx.commentKeywordMatch.deleteMany({
                        where: { commentId, keywordId, source: MatchSource.POST },
                    });
                }
            }
            if (toCreate.length > 0) {
                await tx.commentKeywordMatch.createMany({
                    data: toCreate.map(({ commentId, keywordId }) => ({
                        commentId,
                        keywordId,
                        source: MatchSource.POST,
                    })),
                    skipDuplicates: true,
                });
            }
        });
    }
};
CommentsSaverService = CommentsSaverService_1 = __decorate([
    Injectable(),
    __param(1, Optional()),
    __metadata("design:paramtypes", [PrismaService,
        CommentsSearchIndexerService])
], CommentsSaverService);
export { CommentsSaverService };
//# sourceMappingURL=comments-saver.service.js.map