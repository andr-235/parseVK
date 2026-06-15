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
import { Injectable, Inject, } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PrismaService } from '../prisma.service.js';
import { MetricsService } from './metrics.service.js';
let MetricsUpdaterService = class MetricsUpdaterService {
    prisma;
    metricsService;
    cacheManager;
    intervalId = null;
    UPDATE_INTERVAL_MS = 30_000;
    REDIS_METRICS_INTERVAL_MS = 60_000;
    REDIS_SCAN_COUNT = 500;
    lastRedisMetricsAt = null;
    constructor(prisma, metricsService, cacheManager) {
        this.prisma = prisma;
        this.metricsService = metricsService;
        this.cacheManager = cacheManager;
    }
    onModuleInit() {
        void this.updateMetrics();
        this.intervalId = setInterval(() => {
            void this.updateMetrics();
        }, this.UPDATE_INTERVAL_MS);
    }
    onModuleDestroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    async updateMetrics() {
        try {
            const [activeTasks, watchlistCount] = await Promise.all([
                this.prisma.task.count({
                    where: { status: 'running' },
                }),
                this.prisma.watchlistAuthor.count({
                    where: { status: 'ACTIVE' },
                }),
            ]);
            this.metricsService.setActiveTasks(activeTasks);
            this.metricsService.setActiveWatchlistAuthors(watchlistCount);
        }
        catch {
        }
        await this.updateRedisMetricsIfDue();
    }
    async updateRedisMetricsIfDue() {
        const now = Date.now();
        if (this.lastRedisMetricsAt &&
            now - this.lastRedisMetricsAt < this.REDIS_METRICS_INTERVAL_MS) {
            return;
        }
        this.lastRedisMetricsAt = now;
        try {
            await this.updateRedisMetrics();
        }
        catch {
        }
    }
    async updateRedisMetrics() {
        const client = await this.resolveRedisClient();
        if (!client) {
            return;
        }
        const keysTotal = await this.getRedisDbSize(client);
        if (keysTotal === null) {
            return;
        }
        this.metricsService.setRedisKeysTotal(keysTotal);
        const infoMemory = await client.info('memory');
        const usedMemory = this.parseInfoValue(infoMemory, 'used_memory');
        if (usedMemory !== null) {
            this.metricsService.setRedisMemoryBytes(usedMemory);
        }
        const infoStats = await client.info('stats');
        const hits = this.parseInfoValue(infoStats, 'keyspace_hits');
        const misses = this.parseInfoValue(infoStats, 'keyspace_misses');
        if (hits !== null && misses !== null) {
            const total = hits + misses;
            const hitRate = total > 0 ? hits / total : 0;
            this.metricsService.setRedisKeyspaceHitRate(hitRate);
        }
        const avgTtlSeconds = keysTotal > 0 ? await this.calculateAverageTtlSeconds(client) : 0;
        this.metricsService.setRedisAverageTtlSeconds(avgTtlSeconds);
    }
    async resolveRedisClient() {
        const stores = [];
        if (Array.isArray(this.cacheManager.stores)) {
            stores.push(...this.cacheManager.stores);
        }
        const singleStore = this.cacheManager.store;
        if (singleStore) {
            stores.push(singleStore);
        }
        for (const entry of stores) {
            const candidate = entry.store ?? entry;
            const store = candidate;
            let client = store.client ??
                store.redis;
            if (!client &&
                typeof store.getClient === 'function') {
                const maybeClient = store.getClient?.();
                client =
                    maybeClient instanceof Promise ? await maybeClient : maybeClient;
            }
            if (client &&
                typeof client.info === 'function' &&
                typeof client.scan === 'function' &&
                typeof client.multi === 'function') {
                return client;
            }
        }
        return null;
    }
    async getRedisDbSize(client) {
        if (client.dbSize) {
            return await client.dbSize();
        }
        if (client.dbsize) {
            return await client.dbsize();
        }
        return null;
    }
    parseInfoValue(info, field) {
        const match = new RegExp(`^${field}:(\\d+)`, 'm').exec(info);
        if (!match) {
            return null;
        }
        const value = Number.parseInt(match[1], 10);
        return Number.isFinite(value) ? value : null;
    }
    normalizeScanReply(reply) {
        if (Array.isArray(reply)) {
            const cursor = reply[0] ? String(reply[0]) : '0';
            const keys = Array.isArray(reply[1]) ? reply[1] : [];
            return { cursor, keys };
        }
        if (reply &&
            typeof reply === 'object' &&
            'cursor' in reply &&
            'keys' in reply) {
            const typed = reply;
            return { cursor: typed.cursor, keys: typed.keys ?? [] };
        }
        return { cursor: '0', keys: [] };
    }
    async calculateAverageTtlSeconds(client) {
        let cursor = '0';
        let totalKeys = 0;
        let totalTtlMs = 0;
        do {
            const reply = await client.scan(cursor, {
                COUNT: this.REDIS_SCAN_COUNT,
            });
            const normalized = this.normalizeScanReply(reply);
            cursor = normalized.cursor;
            const keys = normalized.keys;
            if (!keys.length) {
                continue;
            }
            const pipeline = client.multi();
            for (const key of keys) {
                pipeline.pttl(key);
            }
            const results = await pipeline.exec();
            if (results) {
                for (const result of results) {
                    const ttl = Array.isArray(result) ? result[1] : null;
                    if (typeof ttl === 'number' && ttl > 0) {
                        totalTtlMs += ttl;
                    }
                }
            }
            totalKeys += keys.length;
        } while (cursor !== '0');
        if (totalKeys === 0) {
            return 0;
        }
        return totalTtlMs / totalKeys / 1000;
    }
};
MetricsUpdaterService = __decorate([
    Injectable(),
    __param(2, Inject(CACHE_MANAGER)),
    __metadata("design:paramtypes", [PrismaService,
        MetricsService, Object])
], MetricsUpdaterService);
export { MetricsUpdaterService };
//# sourceMappingURL=metrics-updater.service.js.map