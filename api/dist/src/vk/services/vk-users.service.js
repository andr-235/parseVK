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
var VkUsersService_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { APIError, VK } from 'vk-io';
import { buildUsersCacheKey, CACHE_TTL, } from '../../common/constants/cache-keys.js';
import { VkApiRequestManager } from './vk-api-request-manager.service.js';
import { VkApiBatchingService } from './vk-api-batching.service.js';
import { VK_INSTANCE } from './vk-groups.service.js';
let VkUsersService = VkUsersService_1 = class VkUsersService {
    cacheManager;
    vk;
    requestManager;
    batchingService;
    logger = new Logger(VkUsersService_1.name);
    constructor(cacheManager, vk, requestManager, batchingService) {
        this.cacheManager = cacheManager;
        this.vk = vk;
        this.requestManager = requestManager;
        this.batchingService = batchingService;
    }
    async getAuthors(userIds) {
        if (!userIds.length) {
            return [];
        }
        const normalizedIds = userIds.map((id) => typeof id === 'number' ? id : Number.parseInt(String(id), 10));
        const cacheKey = buildUsersCacheKey(normalizedIds);
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            this.logger.debug(`Cache HIT: ${cacheKey}`);
            return cached;
        }
        this.logger.debug(`Cache MISS: ${cacheKey}`);
        const fields = [
            'about',
            'activities',
            'bdate',
            'books',
            'career',
            'city',
            'connections',
            'contacts',
            'counters',
            'country',
            'domain',
            'education',
            'followers_count',
            'home_town',
            'interests',
            'last_seen',
            'maiden_name',
            'military',
            'movies',
            'music',
            'nickname',
            'occupation',
            'personal',
            'photo_50',
            'photo_100',
            'photo_200',
            'photo_200_orig',
            'photo_400_orig',
            'photo_id',
            'photo_max',
            'photo_max_orig',
            'relation',
            'relatives',
            'schools',
            'screen_name',
            'sex',
            'site',
            'status',
            'timezone',
            'tv',
            'universities',
        ];
        const usersMap = new Map();
        const batchResults = await this.batchingService.batch(normalizedIds, async (batch) => {
            const result = await this.requestManager.execute(() => this.vk.api.users.get({
                user_ids: batch.map(String),
                fields: fields.filter((f) => f !== 'counters' && f !== 'military'),
            }), {
                method: 'users.get',
                key: 'users:get',
            });
            return result;
        }, { maxBatchSize: 1000 });
        for (const user of batchResults) {
            usersMap.set(user.id, user);
        }
        const users = Array.from(usersMap.values());
        const normalizeBoolean = (value) => {
            if (typeof value === 'number') {
                return value === 1;
            }
            return value ?? undefined;
        };
        const result = users.map((user) => ({
            id: user.id,
            first_name: user.first_name ?? '',
            last_name: user.last_name ?? '',
            deactivated: user.deactivated ?? undefined,
            is_closed: normalizeBoolean(user.is_closed),
            can_access_closed: normalizeBoolean(user.can_access_closed),
            domain: user.domain ?? undefined,
            screen_name: user.screen_name ?? undefined,
            photo_50: user.photo_50 ?? undefined,
            photo_100: user.photo_100 ?? undefined,
            photo_200: user.photo_200 ?? undefined,
            photo_200_orig: user.photo_200_orig ?? undefined,
            photo_400_orig: user.photo_400_orig ?? undefined,
            photo_max: user.photo_max ?? undefined,
            photo_max_orig: user.photo_max_orig ?? undefined,
            photo_id: user.photo_id ?? undefined,
            city: user.city ?? undefined,
            country: user.country ?? undefined,
            about: user.about ?? undefined,
            activities: user.activities ?? undefined,
            bdate: user.bdate ?? undefined,
            books: user.books ?? undefined,
            career: user.career,
            connections: user.connections,
            contacts: user.contacts,
            counters: user.counters,
            education: user.education,
            followers_count: typeof user.followers_count === 'number'
                ? user.followers_count
                : undefined,
            home_town: user.home_town ?? undefined,
            interests: user.interests ?? undefined,
            last_seen: user.last_seen ?? undefined,
            maiden_name: user.maiden_name ?? undefined,
            military: user.military ?? undefined,
            movies: user.movies ?? undefined,
            music: user.music ?? undefined,
            nickname: user.nickname ?? undefined,
            occupation: user.occupation ?? undefined,
            personal: user.personal ?? undefined,
            relatives: user.relatives ?? undefined,
            relation: typeof user.relation === 'number' ? user.relation : undefined,
            schools: user.schools ?? undefined,
            sex: typeof user.sex === 'number' ? user.sex : undefined,
            site: user.site ?? undefined,
            status: user.status ?? undefined,
            timezone: typeof user.timezone === 'number' ? user.timezone : undefined,
            tv: user.tv ?? undefined,
            universities: user.universities ?? undefined,
        }));
        await this.cacheManager.set(cacheKey, result, CACHE_TTL.VK_USER * 1000);
        return result;
    }
    async getUserPhotos(options) {
        const { userId, count = 100, offset = 0 } = options;
        try {
            const response = await this.requestManager.execute(() => this.vk.api.photos.getAll({
                owner_id: userId,
                count: Math.min(Math.max(count, 1), 200),
                offset,
                extended: 0,
                photo_sizes: 1,
            }), {
                method: 'photos.getAll',
                key: `photos:${userId}`,
            });
            const items = response.items ?? [];
            return items.map((photo) => ({
                id: photo.id,
                owner_id: photo.owner_id,
                photo_id: `${photo.owner_id}_${photo.id}`,
                album_id: photo.album_id,
                date: photo.date,
                text: photo.text ?? undefined,
                sizes: (photo.sizes ?? []).map((size) => {
                    const typedSize = size;
                    return {
                        type: typedSize.type,
                        url: typedSize.url,
                        width: typedSize.width ?? 0,
                        height: typedSize.height ?? 0,
                    };
                }),
            }));
        }
        catch (error) {
            if (error instanceof APIError) {
                this.logger.error(`VK API error fetching photos for user ${userId}: ${error.message}`);
            }
            throw error;
        }
    }
    getMaxPhotoSize(sizes) {
        if (!sizes?.length) {
            return null;
        }
        const priority = ['w', 'z', 'y', 'x', 'm', 's'];
        for (const type of priority) {
            const size = sizes.find((item) => item.type === type && Boolean(item.url));
            if (size?.url) {
                return size.url;
            }
        }
        return sizes[0]?.url ?? null;
    }
};
VkUsersService = VkUsersService_1 = __decorate([
    Injectable(),
    __param(0, Inject(CACHE_MANAGER)),
    __param(1, Inject(VK_INSTANCE)),
    __metadata("design:paramtypes", [Object, VK,
        VkApiRequestManager,
        VkApiBatchingService])
], VkUsersService);
export { VkUsersService };
//# sourceMappingURL=vk-users.service.js.map