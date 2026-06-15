export declare const CACHE_KEYS: {
    readonly VK_GROUP: "vk:group";
    readonly VK_USER: "vk:user";
    readonly VK_POST: "vk:post";
    readonly VK_COMMENTS: "vk:comments";
};
export declare const CACHE_TTL: {
    readonly VK_GROUP: 3600;
    readonly VK_USER: 1800;
    readonly VK_POST: 600;
    readonly VK_COMMENTS: 300;
};
export declare function buildGroupCacheKey(groupId: number | string): string;
export declare function buildUserCacheKey(userId: number): string;
export declare function buildUsersCacheKey(userIds: number[]): string;
export declare function buildPostsCacheKey(ownerId: number, offset: number, count: number): string;
export declare function buildCommentsCacheKey(ownerId: number, postId: number, offset: number): string;
