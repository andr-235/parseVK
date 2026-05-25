import type { AuthorCard } from '@/types'

export const isValidAuthorId = (vkUserId: number): boolean => {
  return Number.isInteger(vkUserId) && vkUserId > 0
}

export const resolveProfileUrl = (author: AuthorCard): string => {
  if (author.profileUrl) {
    return author.profileUrl
  }

  if (author.domain) {
    return `https://vk.com/${author.domain}`
  }

  if (author.screenName) {
    return `https://vk.com/${author.screenName}`
  }

  return `https://vk.com/id${author.vkUserId}`
}

export const resolveCityLabel = (city: AuthorCard['city']): string | null => {
  if (!city) {
    return null
  }

  if (typeof city === 'string') {
    const trimmed = city.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  const cityRecord = city as { title?: unknown; name?: unknown }
  const title = typeof cityRecord.title === 'string' ? cityRecord.title.trim() : ''
  const name = typeof cityRecord.name === 'string' ? cityRecord.name.trim() : ''
  const resolved = title || name

  return resolved.length > 0 ? resolved : null
}
