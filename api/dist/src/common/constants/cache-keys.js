export const CACHE_KEYS = {
    VK_GROUP: 'vk:group',
    VK_USER: 'vk:user',
    VK_POST: 'vk:post',
    VK_COMMENTS: 'vk:comments',
};
export const CACHE_TTL = {
    VK_GROUP: 3600,
    VK_USER: 1800,
    VK_POST: 600,
    VK_COMMENTS: 300,
};
export function buildGroupCacheKey(groupId) {
    return `${CACHE_KEYS.VK_GROUP}:${groupId}`;
}
export function buildUserCacheKey(userId) {
    return `${CACHE_KEYS.VK_USER}:${userId}`;
}
export function buildUsersCacheKey(userIds) {
    return `${CACHE_KEYS.VK_USER}:batch:${userIds.sort().join(',')}`;
}
export function buildPostsCacheKey(ownerId, offset, count) {
    return `${CACHE_KEYS.VK_POST}:${ownerId}:${offset}:${count}`;
}
export function buildCommentsCacheKey(ownerId, postId, offset) {
    return `${CACHE_KEYS.VK_COMMENTS}:${ownerId}:${postId}:${offset}`;
}
//# sourceMappingURL=cache-keys.js.map