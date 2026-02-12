import { Injectable } from '@nestjs/common';
import type { IAuthor } from './interfaces/author.interfaces.js';
import type { IComment } from './interfaces/comment.interfaces.js';
import type { IPost } from './interfaces/post.interfaces.js';
import type { IGroup } from './interfaces/group.interfaces.js';
import type {
  GetCommentsOptions,
  GetCommentsResponse,
  VkPhoto,
  VkPhotoSize,
} from './interfaces/vk-service.interfaces.js';
import { VkGroupsService } from './services/vk-groups.service.js';
import { VkPostsService } from './services/vk-posts.service.js';
import { VkCommentsService } from './services/vk-comments.service.js';
import { VkUsersService } from './services/vk-users.service.js';

export type {
  GetCommentsOptions,
  GetCommentsResponse,
  VkPhoto,
  VkPhotoSize,
} from './interfaces/vk-service.interfaces.js';

/**
 * Фасад для работы с VK API.
 *
 * Делегирует вызовы специализированным сервисам:
 * - VkGroupsService — группы и поиск
 * - VkPostsService — посты
 * - VkCommentsService — комментарии
 * - VkUsersService — пользователи и фото
 */
@Injectable()
export class VkService {
  constructor(
    private readonly groupsService: VkGroupsService,
    private readonly postsService: VkPostsService,
    private readonly commentsService: VkCommentsService,
    private readonly usersService: VkUsersService,
  ) {}

  getGroups(id: string | number): Promise<{ groups: any[]; profiles: any[] }> {
    return this.groupsService.getGroups(id);
  }

  getPosts(posts: Array<{ ownerId: number; postId: number }>) {
    return this.postsService.getPosts(posts);
  }

  getAuthors(userIds: Array<string | number>): Promise<IAuthor[]> {
    return this.usersService.getAuthors(userIds);
  }

  getUserPhotos(options: {
    userId: number;
    count?: number;
    offset?: number;
  }): Promise<VkPhoto[]> {
    return this.usersService.getUserPhotos(options);
  }

  getMaxPhotoSize(sizes: VkPhotoSize[]): string | null {
    return this.usersService.getMaxPhotoSize(sizes);
  }

  checkApiHealth(): Promise<void> {
    return this.groupsService.checkApiHealth();
  }

  getGroupRecentPosts(options: {
    ownerId: number;
    count?: number;
    offset?: number;
  }): Promise<IPost[]> {
    return this.postsService.getGroupRecentPosts(options);
  }

  searchGroupsByRegion({ query }: { query?: string }): Promise<IGroup[]> {
    return this.groupsService.searchGroupsByRegion({ query });
  }

  getComments(options: GetCommentsOptions): Promise<GetCommentsResponse> {
    return this.commentsService.getComments(options);
  }

  getAuthorCommentsForPost(options: {
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
}
