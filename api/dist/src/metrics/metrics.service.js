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
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics, } from 'prom-client';
let MetricsService = class MetricsService {
    register;
    httpRequestDuration;
    httpRequestTotal;
    tasksTotal;
    tasksActive;
    watchlistAuthorsActive;
    vkApiRequests;
    vkApiDuration;
    vkApiTimeouts;
    vkApiRetries;
    redisKeysTotal;
    redisAvgTtlSeconds;
    redisMemoryBytes;
    redisKeyspaceHitRate;
    constructor() {
        this.register = new Registry();
        this.register.setDefaultLabels({ app: 'parsevk-api' });
        this.httpRequestDuration = new Histogram({
            name: 'http_request_duration_seconds',
            help: 'HTTP request duration in seconds',
            labelNames: ['method', 'route', 'status'],
            buckets: [0.1, 0.5, 1, 2, 5, 10],
            registers: [this.register],
        });
        this.httpRequestTotal = new Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status'],
            registers: [this.register],
        });
        this.tasksTotal = new Counter({
            name: 'tasks_total',
            help: 'Total number of parsing tasks',
            labelNames: ['status'],
            registers: [this.register],
        });
        this.tasksActive = new Gauge({
            name: 'tasks_active',
            help: 'Number of active parsing tasks',
            registers: [this.register],
        });
        this.watchlistAuthorsActive = new Gauge({
            name: 'watchlist_authors_active',
            help: 'Number of active watchlist authors',
            registers: [this.register],
        });
        this.vkApiRequests = new Counter({
            name: 'vk_api_requests_total',
            help: 'Total number of VK API requests',
            labelNames: ['method', 'status'],
            registers: [this.register],
        });
        this.vkApiDuration = new Histogram({
            name: 'vk_api_request_duration_seconds',
            help: 'VK API request duration in seconds',
            labelNames: ['method'],
            buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30, 45],
            registers: [this.register],
        });
        this.vkApiTimeouts = new Counter({
            name: 'vk_api_timeouts_total',
            help: 'Total number of VK API timeouts',
            labelNames: ['method', 'attempt'],
            registers: [this.register],
        });
        this.vkApiRetries = new Counter({
            name: 'vk_api_retries_total',
            help: 'Total number of VK API retry attempts',
            labelNames: ['method', 'reason'],
            registers: [this.register],
        });
        this.redisKeysTotal = new Gauge({
            name: 'redis_keys_total',
            help: 'Total number of keys in Redis',
            registers: [this.register],
        });
        this.redisAvgTtlSeconds = new Gauge({
            name: 'redis_avg_ttl_seconds',
            help: 'Average TTL of keys in Redis (seconds)',
            registers: [this.register],
        });
        this.redisMemoryBytes = new Gauge({
            name: 'redis_memory_bytes',
            help: 'Redis memory usage in bytes',
            registers: [this.register],
        });
        this.redisKeyspaceHitRate = new Gauge({
            name: 'redis_keyspace_hit_rate',
            help: 'Redis keyspace hit rate (0-1)',
            registers: [this.register],
        });
    }
    onModuleInit() {
        collectDefaultMetrics({ register: this.register });
    }
    recordHttpRequest(method, route, status, duration) {
        const labels = {
            method,
            route: this.normalizeRoute(route),
            status: status.toString(),
        };
        this.httpRequestDuration.observe(labels, duration / 1000);
        this.httpRequestTotal.inc(labels);
    }
    recordTask(status) {
        this.tasksTotal.inc({ status });
    }
    setActiveTasks(count) {
        this.tasksActive.set(count);
    }
    setActiveWatchlistAuthors(count) {
        this.watchlistAuthorsActive.set(count);
    }
    recordVkApiRequest(method, status, duration) {
        this.vkApiRequests.inc({ method, status });
        this.vkApiDuration.observe({ method }, duration / 1000);
    }
    recordVkApiTimeout(method, attempt) {
        this.vkApiTimeouts.inc({ method, attempt: attempt.toString() });
    }
    recordVkApiRetry(method, reason) {
        this.vkApiRetries.inc({ method, reason });
    }
    setRedisKeysTotal(count) {
        if (Number.isFinite(count)) {
            this.redisKeysTotal.set(count);
        }
    }
    setRedisAverageTtlSeconds(ttlSeconds) {
        if (Number.isFinite(ttlSeconds)) {
            this.redisAvgTtlSeconds.set(ttlSeconds);
        }
    }
    setRedisMemoryBytes(bytes) {
        if (Number.isFinite(bytes)) {
            this.redisMemoryBytes.set(bytes);
        }
    }
    setRedisKeyspaceHitRate(rate) {
        if (Number.isFinite(rate)) {
            this.redisKeyspaceHitRate.set(rate);
        }
    }
    async getMetrics() {
        return this.register.metrics();
    }
    normalizeRoute(route) {
        return route
            .split('?')[0]
            .replace(/\/\d+/g, '/:id')
            .replace(/\/api\//, '/')
            .replace(/^\/+/, '/');
    }
};
MetricsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], MetricsService);
export { MetricsService };
//# sourceMappingURL=metrics.service.js.map