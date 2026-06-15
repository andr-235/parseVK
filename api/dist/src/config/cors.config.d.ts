import { ConfigService } from '@nestjs/config';
import type { CorsOptions } from 'cors';
import type { Request } from 'express';
import type { AppConfig } from './app.config.js';
export type CorsOptionsDelegate = (req: Request, cb: (err: Error | null, options?: CorsOptions) => void) => void;
export declare class CorsConfigService {
    private readonly logger;
    private readonly allowedOrigins;
    private readonly credentialedOrigins;
    private readonly credentialedRoutes;
    private static readonly API_PREFIX;
    private static readonly ALLOWED_METHODS;
    private static readonly ALLOWED_HEADERS;
    constructor(configService: ConfigService<AppConfig>);
    buildDelegate(): CorsOptionsDelegate;
    private buildOptions;
    private logConfiguration;
    private static parseList;
    private static normalizeRoute;
}
