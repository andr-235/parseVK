var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { KeywordFormSource, } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma.service.js';
let KeywordsRepository = class KeywordsRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findUnique(where) {
        return this.prisma.keyword.findUniqueOrThrow({ where });
    }
    findUniqueWithForms(where) {
        return this.prisma.keyword.findUniqueOrThrow({
            where,
            include: {
                keywordForms: true,
                keywordFormExclusions: true,
            },
        });
    }
    findMany(where, orderBy, skip, take) {
        return this.prisma.keyword.findMany({ where, orderBy, skip, take });
    }
    count(where) {
        return this.prisma.keyword.count({ where });
    }
    create(data) {
        return this.prisma.keyword.create({ data });
    }
    findUniqueById(where) {
        return this.prisma.keyword.findUniqueOrThrow({ where });
    }
    update(where, data) {
        return this.prisma.keyword.update({ where, data });
    }
    async delete(where) {
        await this.prisma.keyword.delete({ where });
    }
    deleteMany() {
        return this.prisma.keyword.deleteMany({});
    }
    async replaceGeneratedForms(keywordId, forms) {
        await this.prisma.keywordForm.deleteMany({
            where: {
                keywordId,
                source: KeywordFormSource.generated,
            },
        });
        if (forms.length === 0) {
            return;
        }
        await this.prisma.keywordForm.createMany({
            data: forms.map((form) => ({
                keywordId,
                form,
                source: KeywordFormSource.generated,
            })),
            skipDuplicates: true,
        });
    }
    async addManualForm(keywordId, form) {
        await this.prisma.keywordForm.create({
            data: {
                keywordId,
                form,
                source: KeywordFormSource.manual,
            },
        });
    }
    async removeManualForm(keywordId, form) {
        await this.prisma.keywordForm.deleteMany({
            where: {
                keywordId,
                form,
                source: KeywordFormSource.manual,
            },
        });
    }
    async excludeGeneratedForm(keywordId, form) {
        await this.prisma.keywordFormExclusion.create({
            data: {
                keywordId,
                form,
            },
        });
    }
    async removeGeneratedFormExclusion(keywordId, form) {
        await this.prisma.keywordFormExclusion.deleteMany({
            where: {
                keywordId,
                form,
            },
        });
    }
    findManyWithSelect(select) {
        return this.prisma.keyword.findMany({ select });
    }
    findManyForMatching() {
        return this.prisma.keyword.findMany({
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
    }
    countComments() {
        return this.prisma.comment.count();
    }
    countPosts() {
        return this.prisma.post.count();
    }
    findCommentsBatch(params) {
        return this.prisma.comment.findMany({
            select: { id: true, text: true },
            skip: params.skip,
            take: params.take,
        });
    }
    findPostsBatch(params) {
        return this.prisma.post.findMany({
            select: { id: true, ownerId: true, vkPostId: true, text: true },
            skip: params.skip,
            take: params.take,
        });
    }
    findCommentsByPost(params) {
        return this.prisma.comment.findMany({
            where: { ownerId: params.ownerId, postId: params.postId },
            select: { id: true },
        });
    }
    findCommentKeywordMatches(params) {
        return this.prisma.commentKeywordMatch.findMany({
            where: {
                commentId: params.commentId,
                source: params.source,
            },
            select: { keywordId: true },
        });
    }
    findPostKeywordMatches(params) {
        return this.prisma.commentKeywordMatch.findMany({
            where: {
                commentId: { in: params.commentIds },
                source: params.source,
            },
            select: { commentId: true, keywordId: true },
        });
    }
    async deleteCommentKeywordMatches(params) {
        await this.prisma.commentKeywordMatch.deleteMany({
            where: {
                commentId: params.commentId,
                source: params.source,
                ...(params.keywordIds ? { keywordId: { in: params.keywordIds } } : {}),
            },
        });
    }
    async deletePostKeywordMatches(params) {
        await this.prisma.commentKeywordMatch.deleteMany({
            where: {
                commentId: params.commentId,
                keywordId: params.keywordId,
                source: params.source,
            },
        });
    }
    async createCommentKeywordMatches(data) {
        await this.prisma.commentKeywordMatch.createMany({
            data: data.map((item) => ({
                ...item,
                source: item.source,
            })),
            skipDuplicates: true,
        });
    }
};
KeywordsRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], KeywordsRepository);
export { KeywordsRepository };
//# sourceMappingURL=keywords.repository.js.map