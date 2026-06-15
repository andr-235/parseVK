import type { IModerationAdapter, ModerationResult } from '../interfaces/moderation-service.interface.js';
interface PhotoForModeration {
    photoVkId: string;
    url: string;
}
export declare class WebhookModerationAdapter implements IModerationAdapter {
    adapt(rawResponse: unknown, photo: PhotoForModeration): ModerationResult;
    private collectCategory;
    private extractConfidence;
    private toNumber;
    private normalizeConfidence;
}
export {};
