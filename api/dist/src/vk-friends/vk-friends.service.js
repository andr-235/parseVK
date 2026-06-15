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
import { VkApiService } from './vk-api.service.js';
import { VkFriendsRepository, } from './repositories/vk-friends.repository.js';
const DEFAULT_PAGE_SIZE = 1000;
const MAX_PAGE_SIZE = 5000;
const HARD_LIMIT_WITH_FIELDS = 5000;
let VkFriendsService = class VkFriendsService {
    vkApiService;
    repository;
    constructor(vkApiService, repository) {
        this.vkApiService = vkApiService;
        this.repository = repository;
    }
    getStatus() {
        return { status: 'ok' };
    }
    async fetchAllFriends(params, options) {
        const onProgress = options.onProgress;
        const onLog = options.onLog;
        const normalizedPageSize = this.normalizePageSize(options.pageSize);
        const requestedLimit = this.normalizeLimit(params.count);
        const baseOffset = this.normalizeOffset(params.offset);
        const hasFields = Array.isArray(params.fields) && params.fields.length > 0;
        const rawItems = [];
        let totalCount = 0;
        let fetchedCount = 0;
        let warning;
        let effectiveLimit;
        let limitApplied = false;
        let offset = baseOffset;
        onLog?.(`friends.get start (offset=${offset}, pageSize=${normalizedPageSize})`);
        if (requestedLimit !== undefined && requestedLimit <= 0) {
            onLog?.('friends.get finish (fetched=0, total=0)');
            return {
                totalCount,
                fetchedCount,
                warning,
                rawItems,
            };
        }
        while (true) {
            const remainingLimit = effectiveLimit !== undefined
                ? effectiveLimit - fetchedCount
                : requestedLimit !== undefined
                    ? requestedLimit - fetchedCount
                    : undefined;
            if (remainingLimit !== undefined && remainingLimit <= 0) {
                break;
            }
            const requestCount = remainingLimit !== undefined
                ? Math.max(0, Math.min(normalizedPageSize, remainingLimit))
                : normalizedPageSize;
            if (requestCount <= 0) {
                break;
            }
            const response = await this.vkApiService.friendsGet({
                ...params,
                offset,
                count: requestCount,
            });
            if (effectiveLimit === undefined) {
                totalCount = typeof response.count === 'number' ? response.count : 0;
                let hardLimit;
                if (hasFields && totalCount > HARD_LIMIT_WITH_FIELDS) {
                    hardLimit = HARD_LIMIT_WITH_FIELDS;
                }
                effectiveLimit = totalCount;
                if (requestedLimit !== undefined) {
                    effectiveLimit = Math.min(effectiveLimit, requestedLimit);
                }
                if (hardLimit !== undefined) {
                    effectiveLimit = Math.min(effectiveLimit, hardLimit);
                }
                limitApplied = effectiveLimit < totalCount;
                if (hardLimit !== undefined &&
                    totalCount > hardLimit &&
                    effectiveLimit === hardLimit) {
                    warning = `VK limit: при fields максимум 5000. Выгружено 5000 из ${totalCount}.`;
                    onLog?.(warning);
                }
            }
            const items = Array.isArray(response.items) ? response.items : [];
            let pageItems = items;
            if (effectiveLimit !== undefined) {
                const remaining = effectiveLimit - fetchedCount;
                if (remaining <= 0) {
                    pageItems = [];
                }
                else if (pageItems.length > remaining) {
                    pageItems = pageItems.slice(0, remaining);
                }
            }
            if (pageItems.length > 0) {
                rawItems.push(...pageItems);
            }
            fetchedCount += pageItems.length;
            onProgress?.({
                fetchedCount,
                totalCount,
                limitApplied,
            });
            onLog?.(`friends.get page fetched (offset=${offset}, items=${pageItems.length}, total=${totalCount})`);
            if (pageItems.length === 0) {
                break;
            }
            offset += items.length;
            if (effectiveLimit !== undefined && fetchedCount >= effectiveLimit) {
                break;
            }
            if (items.length < requestCount) {
                break;
            }
        }
        onLog?.(`friends.get finish (fetched=${fetchedCount}, total=${totalCount})`);
        return {
            totalCount,
            fetchedCount,
            warning,
            rawItems,
        };
    }
    normalizePageSize(pageSize) {
        if (typeof pageSize !== 'number' || Number.isNaN(pageSize)) {
            return DEFAULT_PAGE_SIZE;
        }
        const normalized = Math.floor(pageSize);
        if (normalized <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(normalized, MAX_PAGE_SIZE);
    }
    normalizeLimit(limit) {
        if (typeof limit !== 'number' || Number.isNaN(limit)) {
            return undefined;
        }
        return Math.max(0, Math.floor(limit));
    }
    normalizeOffset(offset) {
        if (typeof offset !== 'number' || Number.isNaN(offset)) {
            return 0;
        }
        return Math.max(0, Math.floor(offset));
    }
    createJob(input) {
        return this.repository.createJob(input);
    }
    appendLogs(jobId, logs) {
        return this.repository.appendLogs(jobId, logs);
    }
    setJobProgress(jobId, input) {
        return this.repository.setJobProgress(jobId, input);
    }
    completeJob(jobId, input) {
        return this.repository.completeJob(jobId, input);
    }
    failJob(jobId, input) {
        return this.repository.failJob(jobId, input);
    }
    saveFriendsBatch(jobId, records, batchSize) {
        return this.repository.saveFriendsBatch(jobId, records, batchSize);
    }
    getFriendRecordPayloads(jobId) {
        return this.repository.getFriendRecordPayloads(jobId);
    }
    getJobById(jobId) {
        return this.repository.getJobById(jobId);
    }
    getJobLogs(jobId, take) {
        return this.repository.getJobLogs(jobId, take);
    }
};
VkFriendsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [VkApiService,
        VkFriendsRepository])
], VkFriendsService);
export { VkFriendsService };
//# sourceMappingURL=vk-friends.service.js.map