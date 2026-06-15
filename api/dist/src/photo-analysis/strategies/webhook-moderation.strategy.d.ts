import { ConfigService } from '@nestjs/config';
import type { IModerationStrategy } from '../interfaces/moderation-service.interface.js';
import type { AppConfig } from '../../config/app.config.js';
export declare class WebhookModerationStrategy implements IModerationStrategy {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService<AppConfig>);
    moderate(imageUrls: string[]): Promise<unknown[]>;
    private sendModerationRequest;
    private resolveModerationTimeout;
}
