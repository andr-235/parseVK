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
import { PrismaService } from '../../prisma.service.js';
const authorSelect = {
    vkUserId: true,
    firstName: true,
    lastName: true,
    photo50: true,
    photo100: true,
    photo200Orig: true,
};
const keywordSelect = {
    id: true,
    word: true,
    category: true,
    isPhrase: true,
    keywordForms: {
        select: {
            form: true,
        },
    },
};
const commentInclude = {
    author: {
        select: authorSelect,
    },
    commentKeywordMatches: {
        include: {
            keyword: {
                select: keywordSelect,
            },
        },
    },
    post: {
        select: {
            text: true,
            attachments: true,
            group: {
                select: {
                    id: true,
                    vkId: true,
                    name: true,
                    screenName: true,
                    photo100: true,
                    photo200: true,
                },
            },
        },
    },
};
let CommentsRepository = class CommentsRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findMany(params) {
        return this.prisma.comment.findMany({
            where: params.where,
            skip: params.skip,
            take: params.take,
            orderBy: params.orderBy,
            include: commentInclude,
        });
    }
    count(params) {
        return this.prisma.comment.count({
            where: params.where,
        });
    }
    update(params) {
        return this.prisma.comment.update({
            where: params.where,
            data: params.data,
            include: commentInclude,
        });
    }
    transaction(queries) {
        return this.prisma.$transaction(queries);
    }
};
CommentsRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], CommentsRepository);
export { CommentsRepository };
//# sourceMappingURL=comments.repository.js.map