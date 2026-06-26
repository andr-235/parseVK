import { apiGet, apiPost, apiPatch, apiDelete } from './client'
import type { ImMessage, ImSearchResponse, ImKeywordSearchResponse, ImGroup, ImGroupCreatePayload, ImGroupUpdatePayload } from '../../types/im'

type ImMessageRaw = {
  id: number
  text: string | null
  messenger: string
  author: string | null
  chat_name: string | null
  content_url: string | null
  content_type: string | null
  created_at: string | null
  ingested_at: string
  matched_keywords: string[]
}

type ImSearchResponseRaw = {
  items: ImMessageRaw[]
  total: number
  page: number
  limit: number
}

function mapMessage(raw: ImMessageRaw): ImMessage {
  return {
    id: raw.id,
    text: raw.text,
    createdAt: raw.created_at,
    author: raw.author,
    chat: raw.chat_name,
    messenger: raw.messenger,
    contentUrl: raw.content_url,
    contentType: raw.content_type,
    matchedKeywords: raw.matched_keywords ?? [],
  }
}

function mapSearchResponse(raw: ImSearchResponseRaw): ImSearchResponse {
  return {
    items: raw.items.map(mapMessage),
    total: raw.total,
    page: raw.page,
    limit: raw.limit,
  }
}

export type SearchMessagesParams = {
  messenger?: string
  q?: string
  chatId?: string
  author?: string
  page?: number
  limit?: number
}

export async function searchMessages(params: SearchMessagesParams): Promise<ImSearchResponse> {
  const raw = await apiGet<ImSearchResponseRaw>('/im/search/messages', params as Record<string, string | number | undefined>)
  return mapSearchResponse(raw)
}

export type SearchMessagesPostParams = {
  messenger?: string
  query?: string
  chatId?: string
  onlyWithKeywords?: boolean
  keywords?: string[]
  page?: number
  limit?: number
  cursor?: string | null
}

type ImKeywordSearchResponseRaw = {
  items: ImMessageRaw[]
  pageInfo: {
    hasMore: boolean
    nextCursor: string | null
  }
  total: null
  totalMode: string
}

export async function searchMessagesPost(params: SearchMessagesPostParams): Promise<ImSearchResponse | ImKeywordSearchResponse> {
  const raw = await apiPost<ImSearchResponseRaw | ImKeywordSearchResponseRaw>('/im/messages/search', params)
  if ('pageInfo' in raw) {
    return {
      items: raw.items.map(mapMessage),
      pageInfo: raw.pageInfo,
      total: null,
      totalMode: 'not_calculated',
    }
  }
  return mapSearchResponse(raw)
}

type ImGroupRaw = {
  id: number
  messenger: string
  chat_id: string
  name: string
  category: string | null
  created_at: string
  updated_at: string
}

function mapGroup(raw: ImGroupRaw): ImGroup {
  return {
    id: raw.id,
    messenger: raw.messenger,
    chatId: raw.chat_id,
    name: raw.name,
    category: raw.category,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export type ListGroupsParams = {
  messenger?: string
  search?: string
}

export async function listGroups(params?: ListGroupsParams): Promise<{ items: ImGroup[]; total: number }> {
  const data = await apiGet<ImGroupRaw[]>('/im/groups', params as Record<string, string | number | undefined>)
  return { items: data.map(mapGroup), total: data.length }
}

export async function createGroup(payload: ImGroupCreatePayload): Promise<ImGroup> {
  const raw = await apiPost<ImGroupRaw>('/im/groups', { ...payload, chat_id: payload.chatId })
  return mapGroup(raw)
}

export async function updateGroup(id: number, payload: ImGroupUpdatePayload): Promise<ImGroup> {
  const raw = await apiPatch<ImGroupRaw>(`/im/groups/${id}`, payload)
  return mapGroup(raw)
}

export function deleteGroup(id: number): Promise<void> {
  return apiDelete(`/im/groups/${id}`)
}
