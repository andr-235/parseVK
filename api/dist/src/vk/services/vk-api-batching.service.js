var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var VkApiBatchingService_1;
import { Injectable, Logger } from '@nestjs/common';
let VkApiBatchingService = VkApiBatchingService_1 = class VkApiBatchingService {
    logger = new Logger(VkApiBatchingService_1.name);
    defaultMaxBatchSize = 1000;
    defaultMaxWaitMs = 50;
    async batch(requests, batchFn, options = {}) {
        if (requests.length === 0) {
            return [];
        }
        const maxBatchSize = options.maxBatchSize ?? this.defaultMaxBatchSize;
        const results = [];
        for (let i = 0; i < requests.length; i += maxBatchSize) {
            const batch = requests.slice(i, i + maxBatchSize);
            const batchResults = await batchFn(batch);
            results.push(...batchResults);
        }
        return results;
    }
    async batchWithMapping(requests, batchFn, mapFn, options = {}) {
        if (requests.length === 0) {
            return new Map();
        }
        const maxBatchSize = options.maxBatchSize ?? this.defaultMaxBatchSize;
        const resultMap = new Map();
        for (let i = 0; i < requests.length; i += maxBatchSize) {
            const batch = requests.slice(i, i + maxBatchSize);
            const batchData = batch.map((r) => r.data);
            const batchResults = await batchFn(batchData);
            for (let j = 0; j < batch.length; j++) {
                const key = mapFn(batch[j].data, batchResults[j]);
                resultMap.set(key, batchResults[j]);
            }
        }
        return resultMap;
    }
    createBatchQueue(batchFn, options = {}) {
        const maxBatchSize = options.maxBatchSize ?? this.defaultMaxBatchSize;
        const maxWaitMs = options.maxWaitMs ?? this.defaultMaxWaitMs;
        const queue = [];
        let timeout = null;
        const processBatch = async () => {
            if (queue.length === 0) {
                return;
            }
            const currentBatch = queue.splice(0, maxBatchSize);
            const batchData = currentBatch.map((r) => r.data);
            try {
                const results = await batchFn(batchData);
                for (let i = 0; i < currentBatch.length; i++) {
                    currentBatch[i].resolve(results[i]);
                }
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                for (const request of currentBatch) {
                    request.reject(err);
                }
            }
            if (queue.length > 0) {
                scheduleNextBatch();
            }
        };
        const scheduleNextBatch = () => {
            if (timeout) {
                clearTimeout(timeout);
            }
            if (queue.length >= maxBatchSize) {
                void processBatch();
            }
            else {
                timeout = setTimeout(() => {
                    void processBatch();
                }, maxWaitMs);
            }
        };
        return (request) => {
            return new Promise((resolve, reject) => {
                queue.push({
                    id: `${Date.now()}-${Math.random()}`,
                    data: request,
                    resolve: resolve,
                    reject,
                });
                scheduleNextBatch();
            });
        };
    }
};
VkApiBatchingService = VkApiBatchingService_1 = __decorate([
    Injectable()
], VkApiBatchingService);
export { VkApiBatchingService };
//# sourceMappingURL=vk-api-batching.service.js.map