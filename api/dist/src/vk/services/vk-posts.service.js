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
var VkPostsService_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { VK } from 'vk-io';
import { buildPostsCacheKey, CACHE_TTL, } from '../../common/constants/cache-keys.js';
import { VK_POSTS_DEFAULT_COUNT, VK_POSTS_MAX_COUNT, } from '../constants/vk-api.constants.js';
import { VkApiRequestManager } from './vk-api-request-manager.service.js';
import { VK_INSTANCE } from './vk-groups.service.js';
let VkPostsService = VkPostsService_1 = class VkPostsService {
    cacheManager;
    vk;
    requestManager;
    logger = new Logger(VkPostsService_1.name);
    constructor(cacheManager, vk, requestManager) {
        this.cacheManager = cacheManager;
        this.vk = vk;
        this.requestManager = requestManager;
    }
    async getPosts(posts) {
        if (!posts.length) {
            return { items: [], profiles: [], groups: [] };
        }
        const postIds = posts.map(({ ownerId, postId }) => `${ownerId}_${postId}`);
        return this.requestManager.execute(() => this.vk.api.wall.getById({
            posts: postIds,
            extended: 1,
        }), {
            method: 'wall.getById',
            key: 'wall:getById',
        });
    }
    async getGroupRecentPosts(options) {
        const { ownerId, count = VK_POSTS_DEFAULT_COUNT, offset = 0 } = options;
        const normalizedCount = Math.max(0, Math.min(count, VK_POSTS_MAX_COUNT));
        const cacheKey = buildPostsCacheKey(ownerId, offset, normalizedCount);
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            this.logger.debug(`Cache HIT: ${cacheKey}`);
            return cached;
        }
        this.logger.debug(`Cache MISS: ${cacheKey}`);
        const response = await this.requestManager.execute(() => this.vk.api.wall.get({
            owner_id: ownerId,
            count: normalizedCount,
            offset,
            filter: 'all',
        }), {
            method: 'wall.get',
            key: `wall:${ownerId}`,
        });
        const result = this.normalizePosts(response.items ?? []);
        await this.cacheManager.set(cacheKey, result, CACHE_TTL.VK_POST * 1000);
        return result;
    }
    async *iterateGroupPosts(options) {
        const { ownerId, batchSize = VK_POSTS_MAX_COUNT } = options;
        const normalizedCount = Math.max(1, Math.min(batchSize, VK_POSTS_MAX_COUNT));
        let offset = 0;
        while (true) {
            const response = await this.requestManager.execute(() => this.vk.api.wall.get({
                owner_id: ownerId,
                count: normalizedCount,
                offset,
                filter: 'all',
            }), {
                method: 'wall.get',
                key: `wall:${ownerId}`,
            });
            const posts = this.normalizePosts(response.items ?? []);
            if (!posts.length) {
                break;
            }
            yield posts;
            if (posts.length < normalizedCount) {
                break;
            }
            offset += posts.length;
        }
    }
    normalizePosts(items) {
        return items.map((item) => ({
            id: item.id,
            owner_id: item.owner_id,
            from_id: item.from_id,
            date: item.date,
            text: item.text ?? '',
            attachments: item.attachments,
            comments: {
                count: item.comments?.count ?? 0,
                can_post: item.comments?.can_post ?? 0,
                groups_can_post: this.normalizeBoolean(item.comments?.groups_can_post),
                can_close: this.normalizeBoolean(item.comments?.can_close),
                can_open: this.normalizeBoolean(item.comments?.can_open),
            },
        }));
    }
    normalizeBoolean(value) {
        if (typeof value === 'number') {
            return value === 1;
        }
        return Boolean(value);
    }
};
VkPostsService = VkPostsService_1 = __decorate([
    Injectable(),
    __param(0, Inject(CACHE_MANAGER)),
    __param(1, Inject(VK_INSTANCE)),
    __metadata("design:paramtypes", [Object, VK,
        VkApiRequestManager])
], VkPostsService);
export { VkPostsService };
//# sourceMappingURL=vk-posts.service.js.map