import type { JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../../config/app.config.js';
export declare function jwtAccessConfigFactory(configService: ConfigService<AppConfig>): JwtModuleOptions;
