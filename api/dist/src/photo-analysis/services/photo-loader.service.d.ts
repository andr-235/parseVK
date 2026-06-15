import { VkService } from '../../vk/vk.service.js';
import type { VkPhoto } from '../../vk/vk.service.js';
import type { IPhotoLoader } from '../interfaces/photo-loader.interface.js';
export declare class PhotoLoaderService implements IPhotoLoader {
    private readonly vkService;
    private readonly logger;
    constructor(vkService: VkService);
    loadUserPhotos(params: {
        userId: number;
        offset?: number;
        limit?: number;
    }): Promise<VkPhoto[]>;
}
