import type { ICommentResponse } from '@/types/api'

export const COMMENTS_PAGE_SIZE = 100

const normalizeString = (value?: string | null): string => value?.trim() ?? ''

const normalizeCreatedAt = (value: string | null): string => {
  if (!value) {
    return new Date().toISOString()
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toISOString()
}

interface NormalizedAuthor {
  name: string
  id: string | null
  url: string | null
  avatar: string | null
}

const buildCommentUrl = (comment: ICommentResponse): string | null => {
  const ownerId = comment.ownerId ?? null
  const postId = comment.postId ?? null

  if (ownerId === null || postId === null) {
    return null
  }

  const ownerPart = String(ownerId).trim()
  const postPart = String(postId).trim()

  if (!ownerPart || !postPart) {
    return null
  }

  const commentPart = comment.vkCommentId ?? comment.id
  const baseUrl = `https://vk.com/wall${ownerPart}_${postPart}`

  if (commentPart === null || commentPart === undefined) {
    return baseUrl
  }

  const normalizedCommentId = String(commentPart).trim()
  return normalizedCommentId ? `${baseUrl}?reply=${normalizedCommentId}` : baseUrl
}

const resolveAuthorInfo = (comment: ICommentResponse): NormalizedAuthor => {
  const directAuthor = normalizeString(typeof comment.author === 'string' ? comment.author : comment.authorName)

  const authorRecord =
    comment.author && typeof comment.author === 'object'
      ? (comment.author as Record<string, unknown>)
      : null

  const pickNormalizedString = (keys: string[]): string => {
    if (!authorRecord) {
      return ''
    }

    for (const key of keys) {
      const value = authorRecord[key]
      if (typeof value === 'string') {
        const normalized = normalizeString(value)
        if (normalized) {
          return normalized
        }
      }
    }

    return ''
  }

  const pickImageUrl = (keys: string[]): string | null => {
    if (!authorRecord) {
      return null
    }

    for (const key of keys) {
      const value = authorRecord[key]
      if (typeof value === 'string') {
        const normalized = value.trim()
        if (normalized) {
          return normalized
        }
      }
    }

    return null
  }

  const avatar = pickImageUrl([
    'logo',
    'avatar',
    'photo',
    'photoUrl',
    'photo_url',
    'photoMax',
    'photo_max',
    'photo200',
    'photo_200'
  ])

  const directName = directAuthor
    || pickNormalizedString(['fullName', 'full_name', 'name', 'displayName', 'display_name', 'nickname'])

  const firstName = pickNormalizedString(['firstName', 'first_name'])
  const lastName = pickNormalizedString(['lastName', 'last_name'])
  const combinedName = [firstName, lastName].filter(Boolean).join(' ')

  const screenName = pickNormalizedString(['screenName', 'screen_name'])
  const domain = pickNormalizedString(['domain'])

  const fallbackIdRaw = comment.authorVkId ?? comment.fromId ?? null
  const normalizedId = fallbackIdRaw ? String(fallbackIdRaw).trim() : ''
  const profileUrl = normalizedId ? `https://vk.com/id${normalizedId}` : null

  if (directName) {
    return { name: directName, id: normalizedId || null, url: profileUrl, avatar }
  }

  if (combinedName) {
    return { name: combinedName, id: normalizedId || null, url: profileUrl, avatar }
  }

  if (screenName) {
    return { name: screenName, id: normalizedId || null, url: profileUrl, avatar }
  }

  if (domain) {
    return { name: domain, id: normalizedId || null, url: profileUrl, avatar }
  }

  if (normalizedId) {
    const fallbackName = `vk.com/id${normalizedId}`
    return { name: fallbackName, id: normalizedId, url: profileUrl, avatar }
  }

  console.warn('Автор комментария не определён, исходные данные:', comment)
  return { name: 'Неизвестный автор', id: null, url: null, avatar }
}

export const normalizeCommentResponse = (comment: ICommentResponse) => {
  const authorInfo = resolveAuthorInfo(comment)
  const watchlistAuthorId = typeof comment.watchlistAuthorId === 'number' ? comment.watchlistAuthorId : null

  return {
    id: comment.id,
    author: authorInfo.name,
    authorId: authorInfo.id,
    authorUrl: authorInfo.url,
    authorAvatar: authorInfo.avatar,
    commentUrl: buildCommentUrl(comment),
    text: comment.text ?? '',
    createdAt: normalizeCreatedAt(comment.createdAt),
    publishedAt: comment.publishedAt ? normalizeCreatedAt(comment.publishedAt) : null,
    isRead: comment.isRead ?? false,
    watchlistAuthorId,
    isWatchlisted: Boolean(watchlistAuthorId)
  }
}
