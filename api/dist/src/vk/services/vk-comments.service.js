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
var VkCommentsService_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { APIError, VK } from 'vk-io';
import { buildCommentsCacheKey, CACHE_TTL, } from '../../common/constants/cache-keys.js';
import { VK_COMMENTS_MAX_COUNT, VK_COMMENTS_MAX_PAGES, VK_COMMENTS_THREAD_ITEMS_COUNT, VK_ERROR_WALL_DISABLED, } from '../constants/vk-api.constants.js';
import { VkApiRequestManager } from './vk-api-request-manager.service.js';
import { VK_INSTANCE } from './vk-groups.service.js';
let VkCommentsService = VkCommentsService_1 = class VkCommentsService {
    cacheManager;
    vk;
    requestManager;
    logger = new Logger(VkCommentsService_1.name);
    constructor(cacheManager, vk, requestManager) {
        this.cacheManager = cacheManager;
        this.vk = vk;
        this.requestManager = requestManager;
    }
    async getComments(options) {
        const { ownerId, postId, count = VK_COMMENTS_MAX_COUNT, needLikes = true, extended = true, offset = 0, sort, previewLength, commentId, startCommentId, threadItemsCount, fields, } = options;
        const isCacheable = !commentId && !startCommentId && !fields;
        const cacheKey = isCacheable
            ? buildCommentsCacheKey(ownerId, postId, offset)
            : null;
        if (cacheKey) {
            const cached = await this.cacheManager.get(cacheKey);
            if (cached) {
                this.logger.debug(`Cache HIT: ${cacheKey}`);
                return cached;
            }
            this.logger.debug(`Cache MISS: ${cacheKey}`);
        }
        try {
            const response = await this.requestManager.execute(() => this.vk.api.wall.getComments({
                owner_id: ownerId,
                post_id: postId,
                need_likes: needLikes ? 1 : 0,
                extended: extended ? 1 : 0,
                count: Math.max(0, Math.min(count, VK_COMMENTS_MAX_COUNT)),
                offset,
                sort,
                preview_length: previewLength,
                comment_id: commentId,
                start_comment_id: startCommentId,
                thread_items_count: threadItemsCount,
                fields,
            }), {
                method: 'wall.getComments',
                key: `comments:${ownerId}:${postId}`,
            });
            const items = this.mapComments(response.items ?? [], { ownerId, postId });
            const result = {
                ...response,
                items,
            };
            if (cacheKey) {
                await this.cacheManager.set(cacheKey, result, CACHE_TTL.VK_COMMENTS * 1000);
            }
            return result;
        }
        catch (error) {
            if (error instanceof APIError && error.code === VK_ERROR_WALL_DISABLED) {
                return {
                    count: 0,
                    current_level_count: 0,
                    can_post: 0,
                    show_reply_button: 0,
                    groups_can_post: 0,
                    items: [],
                    profiles: [],
                    groups: [],
                };
            }
            throw error;
        }
    }
    async getAuthorCommentsForPost(options) {
        const { ownerId, postId, authorVkId, baseline = null, batchSize = VK_COMMENTS_MAX_COUNT, maxPages = VK_COMMENTS_MAX_PAGES, threadItemsCount = VK_COMMENTS_THREAD_ITEMS_COUNT, } = options;
        const baselineTimestamp = baseline ? baseline.getTime() : null;
        let offset = 0;
        let page = 0;
        const collected = [];
        while (page < maxPages) {
            const response = await this.getComments({
                ownerId,
                postId,
                count: batchSize,
                offset,
                sort: 'desc',
                needLikes: false,
                extended: false,
                threadItemsCount,
            });
            const items = response.items ?? [];
            if (!items.length) {
                break;
            }
            const filtered = this.filterCommentsByAuthor(items, authorVkId, baselineTimestamp);
            if (filtered.length) {
                collected.push(...filtered);
            }
            offset += items.length;
            page += 1;
            if (baselineTimestamp !== null) {
                const oldest = this.findOldestTimestamp(items);
                if (oldest !== null && oldest <= baselineTimestamp) {
                    break;
                }
            }
            if (offset >= (response.count ?? 0)) {
                break;
            }
        }
        return collected;
    }
    mapComments(items, defaults) {
        return items.map((item) => this.mapComment(item, defaults));
    }
    filterCommentsByAuthor(items, authorVkId, baselineTimestamp) {
        const result = [];
        for (const item of items) {
            const childItems = item.threadItems?.length
                ? this.filterCommentsByAuthor(item.threadItems, authorVkId, baselineTimestamp)
                : [];
            const isAuthorComment = item.fromId === authorVkId;
            const isAfterBaseline = baselineTimestamp === null ||
                item.publishedAt.getTime() > baselineTimestamp;
            if (isAuthorComment && isAfterBaseline) {
                result.push({
                    ...item,
                    threadItems: childItems.length ? childItems : undefined,
                });
            }
            else if (childItems.length) {
                result.push(...childItems);
            }
        }
        return result;
    }
    findOldestTimestamp(comments) {
        let oldest = null;
        for (const comment of comments) {
            const timestamp = comment.publishedAt.getTime();
            if (oldest === null || timestamp < oldest) {
                oldest = timestamp;
            }
            if (comment.threadItems?.length) {
                const nestedOldest = this.findOldestTimestamp(comment.threadItems);
                if (nestedOldest !== null &&
                    (oldest === null || nestedOldest < oldest)) {
                    oldest = nestedOldest;
                }
            }
        }
        return oldest;
    }
    mapComment(item, defaults) {
        const ownerId = item.owner_id ?? defaults.ownerId;
        const postId = item.post_id ?? defaults.postId;
        const threadDefaults = { ownerId, postId };
        const thread = item.thread;
        const threadItems = thread?.items
            ? this.mapComments(thread.items, threadDefaults)
            : undefined;
        let threadCount = undefined;
        if (thread && typeof thread === 'object' && thread !== null) {
            const typedThread = thread;
            if ('count' in typedThread) {
                const countValue = typedThread.count;
                if (typeof countValue === 'number') {
                    threadCount = countValue;
                }
            }
        }
        return {
            vkCommentId: item.id,
            ownerId,
            postId,
            fromId: item.from_id,
            text: item.text ?? '',
            publishedAt: new Date(item.date * 1000),
            likesCount: (() => {
                if (item.likes &&
                    typeof item.likes === 'object' &&
                    'count' in item.likes) {
                    const likesObj = item.likes;
                    return typeof likesObj.count === 'number'
                        ? likesObj.count
                        : undefined;
                }
                return undefined;
            })(),
            parentsStack: item.parents_stack,
            threadCount: threadCount,
            threadItems: threadItems && threadItems.length > 0 ? threadItems : undefined,
            attachments: item.attachments,
            replyToUser: item.reply_to_user,
            replyToComment: item.reply_to_comment,
            isDeleted: Boolean(item.deleted),
        };
    }
};
VkCommentsService = VkCommentsService_1 = __decorate([
    Injectable(),
    __param(0, Inject(CACHE_MANAGER)),
    __param(1, Inject(VK_INSTANCE)),
    __metadata("design:paramtypes", [Object, VK,
        VkApiRequestManager])
], VkCommentsService);
export { VkCommentsService };
//# sourceMappingURL=vk-comments.service.js.map