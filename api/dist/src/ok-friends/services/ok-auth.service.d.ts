import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/app.config.js';
export interface OkCredentials {
    accessToken: string;
    applicationKey: string;
    applicationSecretKey: string;
}
export declare class OkAuthService {
    private readonly configService;
    private readonly logger;
    readonly accessToken: string;
    readonly applicationKey: string;
    readonly applicationSecretKey: string;
    constructor(configService: ConfigService<AppConfig>);
    getCredentials(): OkCredentials;
    assertCredentialsAvailable(): void;
    private validateCredentials;
}
