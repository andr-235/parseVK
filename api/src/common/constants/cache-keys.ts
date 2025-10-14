/**
 * Константы для ключей Redis кэша
 *
 * Формат ключей: {prefix}:{entity}:{id/params}
 * TTL указываются в секундах
 */

export const CACHE_KEYS = {
  VK_GROUP: 'vk:group',
  VK_USER: 'vk:user',
  VK_POST: 'vk:post',
  VK_COMMENTS: 'vk:comments',
} as const;

export const CACHE_TTL = {
  VK_GROUP: 3600, // 1 час - группы редко меняются
  VK_USER: 1800, // 30 минут - профили меняются чаще
  VK_POST: 600, // 10 минут - посты могут редактироваться
  VK_COMMENTS: 300, // 5 минут - комментарии часто обновляются
} as const;

/**
 * Генерация ключа для кэша группы
 */
export function buildGroupCacheKey(groupId: number | string): string {
  return `${CACHE_KEYS.VK_GROUP}:${groupId}`;
}

/**
 * Генерация ключа для кэша пользователя
 */
export function buildUserCacheKey(userId: number): string {
  return `${CACHE_KEYS.VK_USER}:${userId}`;
}

/**
 * Генерация ключа для кэша пользователей (batch)
 */
export function buildUsersCacheKey(userIds: number[]): string {
  return `${CACHE_KEYS.VK_USER}:batch:${userIds.sort().join(',')}`;
}

/**
 * Генерация ключа для кэша постов
 */
export function buildPostsCacheKey(
  ownerId: number,
  offset: number,
  count: number,
): string {
  return `${CACHE_KEYS.VK_POST}:${ownerId}:${offset}:${count}`;
}

/**
 * Генерация ключа для кэша комментариев
 */
export function buildCommentsCacheKey(
  ownerId: number,
  postId: number,
  offset: number,
): string {
  return `${CACHE_KEYS.VK_COMMENTS}:${ownerId}:${postId}:${offset}`;
}
