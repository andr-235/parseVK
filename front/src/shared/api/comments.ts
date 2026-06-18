import { apiGet } from './client'
import { type Comment, type Status } from '../../types/comments'

type BackendAuthor = {
  displayName?: string
  fullName?: string
  profileUrl?: string
  screenName?: string
  photo50?: string
}

type BackendGroup = {
  name: string
  screenName?: string
  vkGroupId?: number
  photo50?: string
}

type BackendComment = {
  id: number
  text: string
  ownerId: number
  authorVkId?: number
  createdAt: string
  author?: BackendAuthor
  group?: BackendGroup
  isRead: boolean
}

type BackendListResponse = {
  items: BackendComment[]
  total: number
  hasMore: boolean
}

function formatDate(iso: string): string {
  const dt = new Date(iso)
  const day = String(dt.getDate()).padStart(2, '0')
  const month = String(dt.getMonth() + 1).padStart(2, '0')
  const year = dt.getFullYear()
  return `${day}.${month}.${year}`
}

function mapComment(bc: BackendComment): Comment {
  return {
    id: bc.id,
    text: bc.text,
    group: bc.group?.name ?? (bc.ownerId < 0 ? `Группа #${Math.abs(bc.ownerId)}` : `Пользователь #${bc.ownerId}`),
    author: bc.author?.displayName ?? bc.author?.fullName ?? (bc.authorVkId ? `Пользователь #${bc.authorVkId}` : `vk${bc.ownerId}`),
    authorUrl: bc.author?.profileUrl || (bc.authorVkId ? `https://vk.com/id${bc.authorVkId}` : undefined),
    authorScreenName: bc.author?.screenName,
    authorAvatar: bc.author?.photo50,
    groupUrl: bc.group?.screenName ? `https://vk.com/${bc.group.screenName}` : (bc.ownerId < 0 ? `https://vk.com/club${Math.abs(bc.ownerId)}` : undefined),
    groupScreenName: bc.group?.screenName,
    groupAvatar: bc.group?.photo50,
    date: formatDate(bc.createdAt),
    status: (bc.isRead ? 'Проверка' : 'Новый') as Status,
  }
}

export type CommentsQueryParams = {
  page: number
  pageSize: number
  search?: string
}

export async function fetchComments(params: CommentsQueryParams): Promise<{ comments: Comment[]; total: number }> {
  const data = await apiGet<BackendListResponse>('/comments', {
    offset: (params.page - 1) * params.pageSize,
    limit: params.pageSize,
    search: params.search || undefined,
  })
  return {
    comments: data.items.map(mapComment),
    total: data.total,
  }
}
