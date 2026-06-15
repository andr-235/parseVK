import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../../config/app.config.js';
export declare function authThrottlerConfigFactory(configService: ConfigService<AppConfig>): {
    ttl: number;
    limit: number;
}[];
