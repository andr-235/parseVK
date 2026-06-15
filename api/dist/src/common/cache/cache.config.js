var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CacheConfigService_1;
import { redisStore } from 'cache-manager-redis-yet';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const DEFAULT_TTL_MS = 3600 * 1000;
let CacheConfigService = CacheConfigService_1 = class CacheConfigService {
    configService;
    logger = new Logger(CacheConfigService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    async createCacheOptions() {
        const host = this.configService.get('redisHost', { infer: true }) || 'redis';
        const port = this.configService.get('redisPort', { infer: true }) || 6379;
        try {
            const store = await redisStore({
                socket: {
                    host,
                    port,
                },
                ttl: DEFAULT_TTL_MS,
            });
            this.logger.log(`Используется Redis кэш по адресу ${host}:${port}`);
            return {
                store,
                ttl: DEFAULT_TTL_MS,
                isGlobal: true,
            };
        }
        catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Не удалось подключиться к Redis (${host}:${port}). Переключаюсь на встроенный in-memory кэш. Причина: ${reason}`);
            return {
                ttl: DEFAULT_TTL_MS,
                isGlobal: true,
            };
        }
    }
};
CacheConfigService = CacheConfigService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], CacheConfigService);
export { CacheConfigService };
//# sourceMappingURL=cache.config.js.map