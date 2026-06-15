import type { IAuthor } from './interfaces/author.interfaces.js';
import type { IComment } from './interfaces/comment.interfaces.js';
import type { IPost } from './interfaces/post.interfaces.js';
import type { IGroup, IGroupsResponse } from './interfaces/group.interfaces.js';
import type { GetCommentsOptions, GetCommentsResponse, VkPhoto, VkPhotoSize } from './interfaces/vk-service.interfaces.js';
import { VkGroupsService } from './services/vk-groups.service.js';
import { VkPostsService } from './services/vk-posts.service.js';
import { VkCommentsService } from './services/vk-comments.service.js';
import { VkUsersService } from './services/vk-users.service.js';
export type { GetCommentsOptions, GetCommentsResponse, VkPhoto, VkPhotoSize, } from './interfaces/vk-service.interfaces.js';
export declare class VkService {
    private readonly groupsService;
    private readonly postsService;
    private readonly commentsService;
    private readonly usersService;
    constructor(groupsService: VkGroupsService, postsService: VkPostsService, commentsService: VkCommentsService, usersService: VkUsersService);
    getGroups(id: string | number): Promise<IGroupsResponse>;
    getPosts(posts: Array<{
        ownerId: number;
        postId: number;
    }>): Promise<import("vk-io/lib/api/schemas/responses.js").WallGetByIdResponse>;
    getAuthors(userIds: Array<string | number>): Promise<IAuthor[]>;
    getUserPhotos(options: {
        userId: number;
        count?: number;
        offset?: number;
    }): Promise<VkPhoto[]>;
    getMaxPhotoSize(sizes: VkPhotoSize[]): string | null;
    checkApiHealth(): Promise<void>;
    getGroupRecentPosts(options: {
        ownerId: number;
        count?: number;
        offset?: number;
    }): Promise<IPost[]>;
    iterateGroupPosts(options: {
        ownerId: number;
        batchSize?: number;
    }): AsyncGenerator<IPost[], void, void>;
    searchGroupsByRegion({ query }: {
        query?: string;
    }): Promise<IGroup[]>;
    getComments(options: GetCommentsOptions): Promise<GetCommentsResponse>;
    getAuthorCommentsForPost(options: {
        ownerId: number;
        postId: number;
        authorVkId: number;
        baseline?: Date | null;
        batchSize?: number;
        maxPages?: number;
        threadItemsCount?: number;
    }): Promise<IComment[]>;
}
