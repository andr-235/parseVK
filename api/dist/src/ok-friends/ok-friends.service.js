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
import { OkApiService, } from './ok-api.service.js';
import { OkFriendsRepository, } from './repositories/ok-friends.repository.js';
import { MAX_FRIENDS_LIMIT } from './ok-friends.constants.js';
const DEFAULT_PAGE_SIZE = 5000;
let OkFriendsService = class OkFriendsService {
    okApiService;
    repository;
    constructor(okApiService, repository) {
        this.okApiService = okApiService;
        this.repository = repository;
    }
    getStatus() {
        return { status: 'ok' };
    }
    async fetchAllFriends(params, options) {
        const onProgress = options.onProgress;
        const onLog = options.onLog;
        const normalizedPageSize = this.normalizePageSize(options.pageSize);
        const baseOffset = this.normalizeOffset(params.offset);
        const rawItems = [];
        let totalCount = 0;
        let fetchedCount = 0;
        let warning;
        let limitApplied = false;
        let offset = baseOffset;
        onLog?.(`friends.get start (offset=${offset}, pageSize=${normalizedPageSize})`);
        while (true) {
            const requestLimit = normalizedPageSize;
            const response = await this.okApiService.friendsGet({
                ...params,
                offset,
                limit: requestLimit,
            });
            const friends = response.friends;
            if (totalCount === 0 && friends.length > 0) {
                totalCount = friends.length;
                if (friends.length >= MAX_FRIENDS_LIMIT) {
                    limitApplied = true;
                    warning = `OK limit: максимум ${MAX_FRIENDS_LIMIT} друзей для обычных пользователей. Возможно, есть еще друзья.`;
                    onLog?.(warning);
                }
            }
            if (friends.length > 0) {
                rawItems.push(...friends);
            }
            fetchedCount += friends.length;
            onProgress?.({
                fetchedCount,
                totalCount: totalCount || fetchedCount,
                limitApplied,
            });
            onLog?.(`friends.get page fetched (offset=${offset}, items=${friends.length}, total=${totalCount || fetchedCount})`);
            if (friends.length === 0) {
                break;
            }
            if (friends.length < requestLimit) {
                break;
            }
            offset += friends.length;
            if (limitApplied && fetchedCount >= MAX_FRIENDS_LIMIT) {
                break;
            }
        }
        onLog?.(`friends.get finish (fetched=${fetchedCount}, total=${totalCount || fetchedCount})`);
        return {
            totalCount: totalCount || fetchedCount,
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
        return Math.min(normalized, MAX_FRIENDS_LIMIT);
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
    async fetchUsersInfo(userIds, options) {
        const onProgress = options.onProgress;
        const onLog = options.onLog;
        if (!userIds || userIds.length === 0) {
            return [];
        }
        const MAX_BATCH_SIZE = 100;
        const allUsers = [];
        const total = userIds.length;
        let processed = 0;
        onLog?.(`users.getInfo start (total users: ${total})`);
        for (let i = 0; i < userIds.length; i += MAX_BATCH_SIZE) {
            const batch = userIds.slice(i, i + MAX_BATCH_SIZE);
            const batchNumber = Math.floor(i / MAX_BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(userIds.length / MAX_BATCH_SIZE);
            onLog?.(`users.getInfo batch ${batchNumber}/${totalBatches} (${batch.length} users)`);
            try {
                const params = {
                    uids: batch,
                    fields: options.fields,
                    emptyPictures: options.emptyPictures,
                };
                const users = await this.okApiService.usersGetInfo(params);
                allUsers.push(...users);
                processed += batch.length;
                onProgress?.({ processed, total });
                onLog?.(`users.getInfo batch ${batchNumber}/${totalBatches} completed (${users.length} users returned)`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                onLog?.(`users.getInfo batch ${batchNumber}/${totalBatches} failed: ${errorMessage}`);
            }
        }
        onLog?.(`users.getInfo finish (processed: ${processed}, returned: ${allUsers.length})`);
        return allUsers;
    }
};
OkFriendsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [OkApiService,
        OkFriendsRepository])
], OkFriendsService);
export { OkFriendsService };
//# sourceMappingURL=ok-friends.service.js.map