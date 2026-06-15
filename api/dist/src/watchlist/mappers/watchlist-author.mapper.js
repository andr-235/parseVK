var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let WatchlistAuthorMapper = class WatchlistAuthorMapper {
    mapAuthor(record, commentsCount, summary) {
        const profile = this.mapProfile(record);
        return {
            id: record.id,
            authorVkId: record.authorVkId,
            status: record.status,
            lastCheckedAt: record.lastCheckedAt
                ? record.lastCheckedAt.toISOString()
                : null,
            lastActivityAt: record.lastActivityAt
                ? record.lastActivityAt.toISOString()
                : null,
            foundCommentsCount: record.foundCommentsCount,
            totalComments: commentsCount,
            monitoringStartedAt: record.monitoringStartedAt.toISOString(),
            monitoringStoppedAt: record.monitoringStoppedAt
                ? record.monitoringStoppedAt.toISOString()
                : null,
            settingsId: record.settingsId,
            author: profile,
            analysisSummary: summary,
        };
    }
    mapProfile(record) {
        const author = record.author;
        const firstName = author?.firstName ?? '';
        const lastName = author?.lastName ?? '';
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() ||
            `id${record.authorVkId}`;
        const avatar = author?.photo200Orig ?? author?.photo100 ?? author?.photo50 ?? null;
        const screenName = author?.screenName ?? null;
        const domain = author?.domain ?? null;
        const profileUrl = screenName
            ? `https://vk.com/${screenName}`
            : domain
                ? `https://vk.com/${domain}`
                : `https://vk.com/id${record.authorVkId}`;
        return {
            vkUserId: record.authorVkId,
            firstName,
            lastName,
            fullName,
            avatar,
            screenName,
            domain,
            profileUrl,
        };
    }
    mapComment(comment) {
        return {
            id: comment.id,
            ownerId: comment.ownerId,
            postId: comment.postId,
            vkCommentId: comment.vkCommentId,
            text: comment.text,
            publishedAt: comment.publishedAt?.toISOString() ?? null,
            createdAt: comment.createdAt.toISOString(),
            source: comment.source,
            commentUrl: this.buildCommentUrl(comment.ownerId, comment.postId, comment.vkCommentId),
        };
    }
    buildCommentUrl(ownerId, postId, vkCommentId) {
        if (!ownerId || !postId) {
            return null;
        }
        const baseUrl = `https://vk.com/wall${ownerId}_${postId}`;
        if (!vkCommentId) {
            return baseUrl;
        }
        return `${baseUrl}?reply=${vkCommentId}`;
    }
};
WatchlistAuthorMapper = __decorate([
    Injectable()
], WatchlistAuthorMapper);
export { WatchlistAuthorMapper };
//# sourceMappingURL=watchlist-author.mapper.js.map