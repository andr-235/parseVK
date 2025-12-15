import type { ThreadItem } from '@/types'

/**
 * Нормализует threadItems из JSON в структурированный формат
 */
export function normalizeThreadItems(threadItems: unknown): ThreadItem[] | null {
  if (!threadItems || !Array.isArray(threadItems)) {
    return null
  }

  return threadItems.map((item) => ({
    vkCommentId: item.vkCommentId ?? item.vk_comment_id ?? 0,
    fromId: item.fromId ?? item.from_id ?? 0,
    text: item.text ?? '',
    publishedAt: item.publishedAt ?? item.published_at ?? new Date().toISOString(),
    likesCount: item.likesCount ?? item.likes_count ?? null,
    replyToComment: item.replyToComment ?? item.reply_to_comment ?? null,
    replyToUser: item.replyToUser ?? item.reply_to_user ?? null,
    attachments: item.attachments ?? null,
    threadItems: item.threadItems
      ? normalizeThreadItems(item.threadItems) ?? undefined
      : undefined,
    author: item.author
      ? {
          vkUserId: item.author.vkUserId ?? item.author.vk_user_id ?? 0,
          firstName: item.author.firstName ?? item.author.first_name ?? '',
          lastName: item.author.lastName ?? item.author.last_name ?? '',
          logo: item.author.logo ?? null,
        }
      : null,
  }))
}

/**
 * Подсчитывает общее количество комментариев в треде (включая вложенные)
 */
export function countThreadItems(threadItems: ThreadItem[] | null | undefined): number {
  if (!threadItems || threadItems.length === 0) {
    return 0
  }

  return threadItems.reduce((count, item) => {
    return count + 1 + countThreadItems(item.threadItems)
  }, 0)
}

/**
 * Проверяет, есть ли в треде непрочитанные комментарии
 */
export function hasUnreadInThread(
  threadItems: ThreadItem[] | null | undefined,
  readCommentIds: Set<number>
): boolean {
  if (!threadItems) {
    return false
  }

  return threadItems.some((item) => {
    const isUnread = !readCommentIds.has(item.vkCommentId)
    const hasUnreadInNested = item.threadItems
      ? hasUnreadInThread(item.threadItems, readCommentIds)
      : false
    return isUnread || hasUnreadInNested
  })
}

/**
 * Находит максимальную глубину вложенности в треде
 */
export function getMaxThreadDepth(
  threadItems: ThreadItem[] | null | undefined,
  currentDepth = 0
): number {
  if (!threadItems || threadItems.length === 0) {
    return currentDepth
  }

  return Math.max(
    ...threadItems.map((item) =>
      item.threadItems ? getMaxThreadDepth(item.threadItems, currentDepth + 1) : currentDepth + 1
    )
  )
}
