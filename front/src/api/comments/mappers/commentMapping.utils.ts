import type { CommentResponseDto } from '../dto/comments.dto'

export type NormalizedAuthor = {
  name: string
  id: string | null
  url: string | null
  avatar: string | null
}

const AUTHOR_AVATAR_KEYS = [
  'logo',
  'avatar',
  'photo',
  'photoUrl',
  'photo_url',
  'photoMax',
  'photo_max',
  'photo200',
  'photo_200',
] as const

const AUTHOR_NAME_KEYS = [
  'fullName',
  'full_name',
  'name',
  'displayName',
  'display_name',
  'nickname',
] as const

const AUTHOR_FIRST_NAME_KEYS = ['firstName', 'first_name'] as const
const AUTHOR_LAST_NAME_KEYS = ['lastName', 'last_name'] as const
const AUTHOR_SCREEN_NAME_KEYS = ['screenName', 'screen_name'] as const
const AUTHOR_DOMAIN_KEYS = ['domain'] as const

export const normalizeString = (value?: string | null): string => value?.trim() ?? ''

export const normalizeCreatedAt = (value: string | null): string => {
  const raw = value?.trim()
  if (!raw) {
    return new Date().toISOString()
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return raw
  }

  return date.toISOString()
}

export const buildCommentUrl = (comment: CommentResponseDto): string | null => {
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const pickNormalizedString = (
  record: Record<string, unknown> | null,
  keys: readonly string[]
): string => {
  if (!record) {
    return ''
  }

  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string') {
      const normalized = normalizeString(value)
      if (normalized) {
        return normalized
      }
    }
  }

  return ''
}

const pickImageUrl = (
  record: Record<string, unknown> | null,
  keys: readonly string[]
): string | null => {
  if (!record) {
    return null
  }

  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string') {
      const normalized = value.trim()
      if (normalized) {
        return normalized
      }
    }
  }

  return null
}

export const resolveAuthorInfo = (comment: CommentResponseDto): NormalizedAuthor => {
  if (comment.isDeleted) {
    return { name: 'Удалённый комментарий', id: null, url: null, avatar: null }
  }

  const directAuthor = normalizeString(
    typeof comment.author === 'string' ? comment.author : comment.authorName
  )

  const authorRecord = isRecord(comment.author) ? comment.author : null

  const avatar = pickImageUrl(authorRecord, AUTHOR_AVATAR_KEYS)

  const directName = directAuthor || pickNormalizedString(authorRecord, AUTHOR_NAME_KEYS)

  const firstName = pickNormalizedString(authorRecord, AUTHOR_FIRST_NAME_KEYS)
  const lastName = pickNormalizedString(authorRecord, AUTHOR_LAST_NAME_KEYS)
  const combinedName = [firstName, lastName].filter(Boolean).join(' ')

  const screenName = pickNormalizedString(authorRecord, AUTHOR_SCREEN_NAME_KEYS)
  const domain = pickNormalizedString(authorRecord, AUTHOR_DOMAIN_KEYS)

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
    return { name: `vk.com/id${normalizedId}`, id: normalizedId, url: profileUrl, avatar }
  }

  return { name: 'Неизвестный автор', id: null, url: null, avatar: null }
}
