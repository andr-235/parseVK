import type { VkPhoto } from '../../vk/vk.service.js';

export interface IPhotoLoader {
  loadUserPhotos(params: {
    userId: number;
    offset?: number;
    limit?: number;
  }): Promise<VkPhoto[]>;
}

export interface IAuthorService {
  findAuthorByVkId(vkUserId: number): Promise<{ id: number; vkUserId: number }>;
}
