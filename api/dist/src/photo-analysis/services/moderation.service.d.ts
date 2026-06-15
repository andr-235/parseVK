import type { IModerationService, IModerationStrategy, IModerationAdapter, ModerationResult } from '../interfaces/moderation-service.interface.js';
export declare class ModerationService implements IModerationService {
    private readonly strategy;
    private readonly adapter;
    constructor(strategy: IModerationStrategy, adapter: IModerationAdapter);
    moderatePhotos(imageUrls: string[]): Promise<ModerationResult[]>;
}
