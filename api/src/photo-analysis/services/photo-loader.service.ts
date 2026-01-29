import { Injectable, Logger } from '@nestjs/common';
import { VkService } from '../../vk/vk.service.js';
import type { VkPhoto } from '../../vk/vk.service.js';
import type { IPhotoLoader } from '../interfaces/photo-loader.interface.js';

const MAX_PHOTO_LIMIT = 200;

@Injectable()
export class PhotoLoaderService implements IPhotoLoader {
  private readonly logger = new Logger(PhotoLoaderService.name);

  constructor(private readonly vkService: VkService) {}

  async loadUserPhotos(params: {
    userId: number;
    offset?: number;
    limit?: number;
  }): Promise<VkPhoto[]> {
    const { userId, offset = 0, limit } = params;
    const photos: VkPhoto[] = [];
    const batchSize = MAX_PHOTO_LIMIT;
    let currentOffset = Math.max(offset, 0);

    while (!limit || photos.length < limit) {
      const remaining = limit
        ? Math.min(limit - photos.length, batchSize)
        : batchSize;

      if (remaining <= 0) {
        break;
      }

      const chunk = await this.vkService.getUserPhotos({
        userId,
        count: remaining,
        offset: currentOffset,
      });

      if (!chunk.length) {
        break;
      }

      photos.push(...chunk);
      currentOffset += chunk.length;

      if (chunk.length < remaining) {
        break;
      }
    }

    return photos;
  }
}
