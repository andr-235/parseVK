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
var WatchlistAuthorRefresherService_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommentSource } from '../../common/types/comment-source.enum.js';
import { CommentsSaverService } from '../../common/services/comments-saver.service.js';
import { VkService } from '../../vk/vk.service.js';
import { normalizeComment } from '../../common/utils/comment-normalizer.utils.js';
import { composeCommentKey, walkCommentTree, } from '../utils/watchlist-comment.utils.js';
import { WATCHLIST_COMMENTS_BATCH_SIZE, WATCHLIST_COMMENTS_MAX_PAGES, } from '../constants/watchlist.constants.js';
import { VK_COMMENTS_THREAD_ITEMS_COUNT } from '../../vk/constants/vk-api.constants.js';
let WatchlistAuthorRefresherService = WatchlistAuthorRefresherService_1 = class WatchlistAuthorRefresherService {
    repository;
    commentsSaver;
    vkService;
    logger = new Logger(WatchlistAuthorRefresherService_1.name);
    constructor(repository, commentsSaver, vkService) {
        this.repository = repository;
        this.commentsSaver = commentsSaver;
        this.vkService = vkService;
    }
    async refreshAuthorRecord(record) {
        const checkTimestamp = new Date();
        let newComments = 0;
        let latestActivity = record.lastActivityAt ?? null;
        try {
            const trackedPosts = await this.repository.getTrackedPosts(record.id, record.authorVkId);
            if (!trackedPosts.length) {
                return 0;
            }
            const existingKeys = await this.repository.loadExistingCommentKeys(record.id, record.authorVkId);
            const baseline = record.lastActivityAt ?? null;
            for (const post of trackedPosts) {
                const { addedCount, maxActivity } = await this.processAuthorPost(record, post, baseline, existingKeys);
                newComments += addedCount;
                if (maxActivity && (!latestActivity || maxActivity > latestActivity)) {
                    latestActivity = maxActivity;
                }
            }
            if (newComments > 0) {
                this.logger.log(`Мониторинг автора ${record.authorVkId}: найдено ${newComments} новых комментариев`);
            }
        }
        catch (error) {
            this.logger.error(`Ошибка обновления автора ${record.authorVkId} в списке "На карандаше"`, error instanceof Error ? error.stack : undefined);
        }
        finally {
            const updateData = {
                lastCheckedAt: checkTimestamp,
                ...(newComments > 0
                    ? { incrementFoundCommentsCount: newComments }
                    : {}),
                ...(latestActivity &&
                    (!record.lastActivityAt || latestActivity > record.lastActivityAt)
                    ? { lastActivityAt: latestActivity }
                    : {}),
            };
            await this.repository.update(record.id, updateData);
        }
        return newComments;
    }
    async processAuthorPost(record, post, baseline, existingKeys) {
        const comments = await this.fetchAuthorCommentsForPost(post.ownerId, post.postId, record.authorVkId, baseline);
        if (!comments.length) {
            return { addedCount: 0, maxActivity: null };
        }
        await this.commentsSaver.saveComments(comments, {
            source: CommentSource.WATCHLIST,
            watchlistAuthorId: record.id,
        });
        let addedCount = 0;
        let maxActivity = null;
        for (const comment of comments) {
            walkCommentTree(comment, (entity) => {
                if (!maxActivity || entity.publishedAt > maxActivity) {
                    maxActivity = entity.publishedAt;
                }
                const key = composeCommentKey(entity.ownerId, entity.vkCommentId);
                if (!existingKeys.has(key)) {
                    existingKeys.add(key);
                    addedCount += 1;
                }
            });
        }
        return { addedCount, maxActivity };
    }
    async fetchAuthorCommentsForPost(ownerId, postId, authorVkId, baseline) {
        const comments = await this.vkService.getAuthorCommentsForPost({
            ownerId,
            postId,
            authorVkId,
            baseline,
            batchSize: WATCHLIST_COMMENTS_BATCH_SIZE,
            maxPages: WATCHLIST_COMMENTS_MAX_PAGES,
            threadItemsCount: VK_COMMENTS_THREAD_ITEMS_COUNT,
        });
        if (!comments.length) {
            return [];
        }
        return comments.map((item) => normalizeComment(item));
    }
};
WatchlistAuthorRefresherService = WatchlistAuthorRefresherService_1 = __decorate([
    Injectable(),
    __param(0, Inject('IWatchlistRepository')),
    __metadata("design:paramtypes", [Object, CommentsSaverService,
        VkService])
], WatchlistAuthorRefresherService);
export { WatchlistAuthorRefresherService };
//# sourceMappingURL=watchlist-author-refresher.service.js.map