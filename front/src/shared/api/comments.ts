import { apiGet } from './client'
import { type Comment, type Status } from '../../types/comments'

type BackendAuthor = {
  displayName?: string
  fullName?: string
}

type BackendComment = {
  id: number
  text: string
  ownerId: number
  createdAt: string
  author?: BackendAuthor
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
    group: bc.ownerId < 0 ? `Группа #${Math.abs(bc.ownerId)}` : `Пользователь #${bc.ownerId}`,
    author: bc.author?.displayName ?? bc.author?.fullName ?? `vk${bc.ownerId}`,
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
