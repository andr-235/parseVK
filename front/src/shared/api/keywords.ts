import { apiGet, apiPost, apiPatch, apiDelete } from './client'

export type Keyword = {
  id: number
  word: string
  category: string | null
  isPhrase: boolean
  enabled: boolean
  scopes: string[]
  createdAt: string
  updatedAt: string
}

type BackendKeyword = {
  id: number
  word: string
  category: string | null
  isPhrase: boolean
  enabled: boolean
  scopes: string[]
  createdAt: string
  updatedAt: string
}

function mapKeyword(b: BackendKeyword): Keyword {
  return {
    id: b.id,
    word: b.word,
    category: b.category,
    isPhrase: b.isPhrase,
    enabled: b.enabled,
    scopes: b.scopes,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  }
}

export type KeywordsResponse = {
  keywords: Keyword[]
  total: number
  page: number
  limit: number
}

export type KeywordsQueryParams = {
  page?: number
  limit?: number
  search?: string
  enabled?: boolean
  scope?: string
}

export async function fetchKeywords(params?: KeywordsQueryParams): Promise<KeywordsResponse> {
  const data = await apiGet<{ keywords: BackendKeyword[]; total: number; page: number; limit: number }>(
    '/keywords',
    params as Record<string, string | number | undefined>,
  )
  return { keywords: data.keywords.map(mapKeyword), total: data.total, page: data.page, limit: data.limit }
}

export async function addKeyword(word: string, category?: string, isPhrase?: boolean): Promise<Keyword> {
  const data = await apiPost<BackendKeyword>('/keywords/add', { word, category, isPhrase })
  return mapKeyword(data)
}

export type BulkAddResult = {
  success: Keyword[]
  failed: string[]
  total: number
  successCount: number
  failedCount: number
  createdCount: number
  updatedCount: number
}

type BackendBulkAdd = {
  success: BackendKeyword[]
  failed: string[]
  total: number
  successCount: number
  failedCount: number
  createdCount: number
  updatedCount: number
}

export async function bulkAddKeywords(words: string[]): Promise<BulkAddResult> {
  const data = await apiPost<BackendBulkAdd>('/keywords/bulk-add', { words })
  return {
    ...data,
    success: data.success.map(mapKeyword),
  }
}

export async function uploadKeywords(file: File): Promise<unknown> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/v1/keywords/upload', { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }))
    throw new Error(err.detail || 'Upload failed')
  }
  return res.json()
}

export async function updateKeyword(id: number, payload: { category?: string }): Promise<Keyword> {
  const data = await apiPatch<BackendKeyword>(`/keywords/${id}`, payload)
  return mapKeyword(data)
}

export async function deleteKeyword(id: number): Promise<void> {
  await apiDelete(`/keywords/${id}`)
}

export type KeywordForm = {
  id: number
  form: string
  source: 'generated' | 'manual'
  createdAt: string
}

type BackendForm = {
  id: number
  form: string
  source: string
  createdAt: string
}

function mapForm(b: BackendForm): KeywordForm {
  return { id: b.id, form: b.form, source: b.source as 'generated' | 'manual', createdAt: b.createdAt }
}

export type KeywordFormsResponse = {
  forms: KeywordForm[]
  exclusions: string[]
}

export async function fetchKeywordForms(id: number): Promise<KeywordFormsResponse> {
  const data = await apiGet<{ forms: BackendForm[]; exclusions: string[] }>(`/keywords/${id}/forms`)
  return { forms: data.forms.map(mapForm), exclusions: data.exclusions }
}

export async function addManualForm(keywordId: number, form: string): Promise<void> {
  await apiPost(`/keywords/${keywordId}/forms/manual`, { form })
}

export async function deleteManualForm(keywordId: number, form: string): Promise<void> {
  await apiDelete(`/keywords/${keywordId}/forms/manual?form=${encodeURIComponent(form)}`)
}

export async function addFormExclusion(keywordId: number, form: string): Promise<void> {
  await apiPost(`/keywords/${keywordId}/forms/exclusions`, { form })
}

export async function deleteFormExclusion(keywordId: number, form: string): Promise<void> {
  await apiDelete(`/keywords/${keywordId}/forms/exclusions?form=${encodeURIComponent(form)}`)
}

export async function recalculateMatches(): Promise<{ id: number }> {
  return apiPost<{ id: number }>('/keywords/recalculate-matches')
}

export async function getRecalculationJob(id: number): Promise<{
  id: number
  status: string
  processed: number
  updated: number
  created: number
  deleted: number
  error: string | null
  finishedAt: string | null
}> {
  return apiGet(`/keywords/recalculation-jobs/${id}`)
}

export async function rebuildForms(): Promise<{ status: string }> {
  return apiPost<{ status: string }>('/keywords/rebuild-forms')
}
