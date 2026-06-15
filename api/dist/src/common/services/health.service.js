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
var HealthService_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PrismaService } from '../../prisma.service.js';
import { VkService } from '../../vk/vk.service.js';
let HealthService = HealthService_1 = class HealthService {
    prisma;
    cacheManager;
    vkService;
    logger = new Logger(HealthService_1.name);
    constructor(prisma, cacheManager, vkService) {
        this.prisma = prisma;
        this.cacheManager = cacheManager;
        this.vkService = vkService;
    }
    async checkHealth() {
        const checks = {
            database: await this.checkDatabase(),
            redis: await this.checkRedis(),
            vkApi: await this.checkVkApi(),
        };
        const status = this.calculateHealthStatus(checks);
        return {
            status,
            checks,
            timestamp: new Date().toISOString(),
        };
    }
    calculateHealthStatus(checks) {
        const allOk = Object.values(checks).every((check) => check.status === 'ok');
        const hasErrors = Object.values(checks).some((check) => check.status === 'error');
        if (allOk) {
            return 'ok';
        }
        if (hasErrors && checks.database.status === 'ok') {
            return 'degraded';
        }
        return 'down';
    }
    async checkReadiness() {
        const checks = {
            database: await this.checkDatabase(),
            redis: await this.checkRedis(),
            vkApi: await this.checkVkApi(),
        };
        const ready = checks.database.status === 'ok';
        return {
            ready,
            checks,
        };
    }
    async measureCheckTime(checkFn, errorMessage, logLevel = 'error') {
        const startTime = Date.now();
        try {
            await checkFn();
            const responseTime = Date.now() - startTime;
            return {
                status: 'ok',
                responseTime,
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            if (logLevel === 'error') {
                this.logger.error(errorMessage, error);
            }
            else {
                this.logger.warn(errorMessage, error);
            }
            return {
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error',
                responseTime,
            };
        }
    }
    async checkDatabase() {
        return this.measureCheckTime(() => this.prisma.$queryRaw `SELECT 1`, 'Database health check failed', 'error');
    }
    async checkRedis() {
        return this.measureCheckTime(() => this.performRedisCheck(), 'Redis health check failed', 'warn');
    }
    async performRedisCheck() {
        const testKey = 'health:check';
        const testValue = 'ok';
        const ttl = 1000;
        await this.cacheManager.set(testKey, testValue, ttl);
        const cached = await this.cacheManager.get(testKey);
        await this.cacheManager.del(testKey);
        if (cached !== testValue) {
            throw new Error('Cache read/write mismatch');
        }
    }
    async checkVkApi() {
        return this.measureCheckTime(() => this.vkService.checkApiHealth(), 'VK API health check failed', 'warn');
    }
};
HealthService = HealthService_1 = __decorate([
    Injectable(),
    __param(1, Inject(CACHE_MANAGER)),
    __metadata("design:paramtypes", [PrismaService, Object, VkService])
], HealthService);
export { HealthService };
//# sourceMappingURL=health.service.js.map