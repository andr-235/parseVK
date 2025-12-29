import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { VK } from 'vk-io';
import type { IAuthor } from './interfaces/author.interfaces';
import type { IComment } from './interfaces/comment.interfaces';
import type { IPost } from './interfaces/post.interfaces';
import type { IGroup } from './interfaces/group.interfaces';
import { VkUsersService } from './services/vk-users.service';
import { VkGroupsService } from './services/vk-groups.service';
import { VkPostsService } from './services/vk-posts.service';
import { VkCommentsService } from './services/vk-comments.service';
import { VkPhotosService } from './services/vk-photos.service';
import { VkCacheService } from './services/vk-cache.service';
import { VkApiRequestManager } from './services/vk-api-request-manager.service';
import { VkApiBatchingService } from './services/vk-api-batching.service';
import { VK_API_CONSTANTS } from './constants/vk-service.constants';

export interface GetCommentsOptions {
  ownerId: number;
  postId: number;
  count?: number;
  offset?: number;
  sort?: 'asc' | 'desc';
  previewLength?: number;
  commentId?: number;
  startCommentId?: number;
  threadItemsCount?: number;
  needLikes?: boolean;
  extended?: boolean;
  fields?: string[];
}

export type GetCommentsResponse = {
  count: number;
  current_level_count: number;
  can_post: number;
  show_reply_button: number;
  groups_can_post: number;
  items: IComment[];
  profiles: any[];
  groups: any[];
};

export interface VkPhotoSize {
  type: string;
  url: string;
  width: number;
  height: number;
}

export interface VkPhoto {
  id: number;
  owner_id: number;
  photo_id: string;
  album_id: number;
  date: number;
  text?: string;
  sizes: VkPhotoSize[];
}

/**
 * Основной сервис для работы с VK API
 *
 * Фасад для всех VK API операций. Делегирует работу специализированным сервисам.
 */
@Injectable()
export class VkService {
  private readonly logger = new Logger(VkService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly vk: VK,
    private readonly configService: ConfigService,
    private readonly usersService: VkUsersService,
    private readonly groupsService: VkGroupsService,
    private readonly postsService: VkPostsService,
    private readonly commentsService: VkCommentsService,
    private readonly photosService: VkPhotosService,
    private readonly cacheService: VkCacheService,
    private readonly requestManager: VkApiRequestManager,
    private readonly batchingService: VkApiBatchingService,
  ) {
    const apiTimeout = this.resolveApiTimeout();
    this.applyApiTimeout(this.vk, apiTimeout);
  }

  async getGroups(
    id: string | number,
  ): Promise<{ groups: any[]; profiles: any[] } | null> {
    return this.groupsService.getGroup(id);
  }

  async getPosts(posts: Array<{ ownerId: number; postId: number }>) {
    return this.postsService.getPosts(posts);
  }

  async getAuthors(userIds: Array<string | number>): Promise<IAuthor[]> {
    return this.usersService.getAuthors(userIds);
  }

  async getUserPhotos(options: {
    userId: number;
    count?: number;
    offset?: number;
  }): Promise<VkPhoto[]> {
    return this.photosService.getUserPhotos(options);
  }

  getMaxPhotoSize(sizes: VkPhoto['sizes']): string | null {
    return this.photosService.getMaxPhotoSize(sizes);
  }

  /**
   * Простая проверка доступности VK API
   * Используется для health check
   */
  async checkApiHealth(): Promise<void> {
    await this.requestManager.execute(
      () =>
        this.vk.api.groups.getById({
          group_ids: ['1'],
        }),
      {
        method: 'groups.getById',
        key: 'health:check',
      },
    );
  }

  async getGroupRecentPosts(options: {
    ownerId: number;
    count?: number;
    offset?: number;
  }): Promise<IPost[]> {
    return this.postsService.getGroupRecentPosts(options);
  }

  async searchGroupsByRegion(options: {
    query?: string;
    regionTitle?: string;
  }): Promise<IGroup[]> {
    return this.groupsService.searchGroupsByRegion(options);
  }

  async getComments(options: GetCommentsOptions): Promise<GetCommentsResponse> {
    return this.commentsService.getComments(options);
  }

  async getAuthorCommentsForPost(options: {
    ownerId: number;
    postId: number;
    authorVkId: number;
    baseline?: Date | null;
    batchSize?: number;
    maxPages?: number;
    threadItemsCount?: number;
  }): Promise<IComment[]> {
    return this.commentsService.getAuthorCommentsForPost(options);
  }

  private resolveApiTimeout(): number {
    const fallback = VK_API_CONSTANTS.API_TIMEOUT_FALLBACK;
    const timeout = this.configService.get<number>('vkApiTimeoutMs');
    return timeout ?? fallback;
  }

  private applyApiTimeout(vk: VK, timeout: number): void {
    if (vk.api?.options) {
      vk.api.options.apiTimeout = timeout;
    }
  }
}
