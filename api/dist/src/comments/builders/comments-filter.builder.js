var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { MatchSource } from '../../generated/prisma/client.js';
let CommentsFilterBuilder = class CommentsFilterBuilder {
    buildBaseWhere({ keywords, keywordSource, search, }) {
        const conditions = [];
        const normalizedKeywords = Array.from(new Set((keywords ?? [])
            .map((keyword) => keyword.trim().toLowerCase())
            .filter((keyword) => keyword.length > 0)));
        if (normalizedKeywords.length > 0) {
            const matchSource = keywordSource
                ? keywordSource === 'COMMENT'
                    ? MatchSource.COMMENT
                    : MatchSource.POST
                : undefined;
            const keywordMatchCondition = {
                commentKeywordMatches: {
                    some: matchSource
                        ? {
                            keyword: {
                                word: { in: normalizedKeywords },
                            },
                            source: matchSource,
                        }
                        : {
                            keyword: {
                                word: { in: normalizedKeywords },
                            },
                        },
                },
            };
            conditions.push(keywordMatchCondition);
        }
        const normalizedSearch = search?.trim();
        if (normalizedSearch) {
            conditions.push({
                OR: [
                    {
                        text: {
                            contains: normalizedSearch,
                            mode: 'insensitive',
                        },
                    },
                    {
                        post: {
                            text: {
                                contains: normalizedSearch,
                                mode: 'insensitive',
                            },
                        },
                    },
                ],
            });
        }
        if (conditions.length === 0) {
            return {};
        }
        if (conditions.length === 1) {
            return conditions[0];
        }
        return { AND: conditions };
    }
    buildReadStatusWhere(readStatus) {
        if (readStatus === 'read') {
            return { isRead: true };
        }
        if (readStatus === 'unread') {
            return { isRead: false };
        }
        return {};
    }
    mergeWhere(...wheres) {
        const normalized = wheres.filter((where) => where && Object.keys(where).length > 0);
        if (normalized.length === 0) {
            return {};
        }
        if (normalized.length === 1) {
            return normalized[0];
        }
        return { AND: normalized };
    }
    buildWhere(filters) {
        const baseWhere = this.buildBaseWhere(filters);
        const readStatusWhere = this.buildReadStatusWhere(filters.readStatus);
        return this.mergeWhere(baseWhere, readStatusWhere);
    }
};
CommentsFilterBuilder = __decorate([
    Injectable()
], CommentsFilterBuilder);
export { CommentsFilterBuilder };
//# sourceMappingURL=comments-filter.builder.js.map