import { Injectable, Logger } from '@nestjs/common';
import { VK } from 'vk-io';
import { VkApiRequestManager } from './vk-api-request-manager.service';
import { VkPhoto, VkPhotoSize } from '../vk.service';
import {
  VK_PHOTO_SIZES_PRIORITY,
  VK_API_CONSTANTS,
} from '../constants/vk-service.constants';

/**
 * Сервис для работы с фото VK API
 */
@Injectable()
export class VkPhotosService {
  private readonly logger = new Logger(VkPhotosService.name);

  constructor(
    private readonly vk: VK,
    private readonly requestManager: VkApiRequestManager,
  ) {}

  /**
   * Получает фото пользователя
   */
  async getUserPhotos(options: {
    userId: number;
    count?: number;
    offset?: number;
  }): Promise<VkPhoto[]> {
    const { userId, count = 100, offset = 0 } = options;

    try {
      const response = await this.requestManager.execute(
        () =>
          this.vk.api.photos.getAll({
            owner_id: userId,
            count: Math.min(
              Math.max(count, 1),
              VK_API_CONSTANTS.PHOTOS_MAX_COUNT,
            ),
            offset,
            extended: 0,
            photo_sizes: 1,
          }),
        {
          method: 'photos.getAll',
          key: `photos:${userId}`,
        },
      );

      const items = response.items ?? [];
      return items.map((photo) => this.mapPhoto(photo));
    } catch (error) {
      this.logger.error(
        `VK API error fetching photos for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Получает максимальный размер фото
   */
  getMaxPhotoSize(sizes: VkPhotoSize[]): string | null {
    if (!sizes?.length) {
      return null;
    }

    for (const type of VK_PHOTO_SIZES_PRIORITY) {
      const size = sizes.find(
        (item) => item.type === type && Boolean(item.url),
      );
      if (size?.url) {
        return size.url;
      }
    }

    return sizes[0]?.url ?? null;
  }

  /**
   * Маппит фото из VK API формата
   */
  private mapPhoto(photo: {
    id: number;
    owner_id: number;
    album_id: number;
    date: number;
    text?: string;
    sizes?: Array<
      | {
          type: string;
          url: string;
          width?: number;
          height?: number;
        }
      | any
    >;
  }): VkPhoto {
    return {
      id: photo.id,
      owner_id: photo.owner_id,
      photo_id: `${photo.owner_id}_${photo.id}`,
      album_id: photo.album_id,
      date: photo.date,
      text: photo.text ?? undefined,
      sizes: (photo.sizes ?? []).map((size) => ({
        type: size.type,
        url: size.url,
        width: size.width ?? 0,
        height: size.height ?? 0,
      })),
    };
  }
}
