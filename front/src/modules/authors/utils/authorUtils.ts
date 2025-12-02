import type { AuthorCard } from '@/types'

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
