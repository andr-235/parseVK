import { apiGet } from './client'
import { type Comment, type Status } from '../../types/comments'

type AuthorDTO = {
  display_name?: string
  full_name?: string
  profile_url?: string
  screen_name?: string
  photo_50?: string
}

type GroupDTO = {
  name: string
  screen_name?: string
  vk_group_id?: number
  photo_50?: string
}

type CommentDTO = {
  id: number
  text: string
  matched_keywords: string[]
  owner_id: number
  author_vk_id?: number
  created_at: string
  author?: AuthorDTO
  group?: GroupDTO
  is_read: boolean
}

type CommentListResponse = {
  items: CommentDTO[]
  total: number
  hasMore: boolean
}

function formatDate(iso: string | undefined | null): string {
  if (!iso) {
    console.warn('[comments] formatDate: missing date input')
    return '—'
  }
  const dt = new Date(iso)
  if (isNaN(dt.getTime())) {
    console.warn('[comments] formatDate: invalid date string', iso)
    return '—'
  }
  const day = String(dt.getDate()).padStart(2, '0')
  const month = String(dt.getMonth() + 1).padStart(2, '0')
  const year = dt.getFullYear()
  return `${day}.${month}.${year}`
}

function mapComment(dto: CommentDTO): Comment {
  const groupName = dto.group?.name ?? (dto.owner_id < 0
    ? `Группа #${Math.abs(dto.owner_id)}`
    : `Пользователь #${dto.owner_id}`)

  let authorName = dto.author?.display_name ?? dto.author?.full_name
  if (!authorName && dto.author_vk_id) {
    authorName = `Пользователь #${dto.author_vk_id}`
  }
  if (!authorName && dto.owner_id) {
    authorName = `vk${dto.owner_id}`
  }
  if (!authorName) {
    console.warn('[comments] mapComment: no author identity for comment', dto.id)
    authorName = 'Неизвестный'
  }

  return {
    id: dto.id,
    text: dto.text,
    matchedKeywords: dto.matched_keywords ?? [],
    group: groupName,
    author: authorName,
    authorUrl: dto.author?.profile_url || (dto.author_vk_id ? `https://vk.com/id${dto.author_vk_id}` : undefined),
    authorScreenName: dto.author?.screen_name,
    authorAvatar: dto.author?.photo_50,
    groupUrl: dto.group?.screen_name ? `https://vk.com/${dto.group.screen_name}` : (dto.owner_id < 0 ? `https://vk.com/club${Math.abs(dto.owner_id)}` : undefined),
    groupScreenName: dto.group?.screen_name,
    groupAvatar: dto.group?.photo_50,
    date: formatDate(dto.created_at),
    status: (dto.is_read ? 'Проверка' : 'Новый') as Status,
  }
}

export type CommentsQueryParams = {
  page: number
  pageSize: number
  search?: string
}

export async function fetchComments(params: CommentsQueryParams): Promise<{ comments: Comment[]; total: number }> {
  const data = await apiGet<CommentListResponse>('/comments', {
    offset: (params.page - 1) * params.pageSize,
    limit: params.pageSize,
    search: params.search || undefined,
  })
  return {
    comments: data.items.map(mapComment),
    total: data.total,
  }
}
