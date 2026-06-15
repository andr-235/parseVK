import { CacheModuleOptions, CacheOptionsFactory } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/app.config.js';
export declare class CacheConfigService implements CacheOptionsFactory {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService<AppConfig>);
    createCacheOptions(): Promise<CacheModuleOptions>;
}
