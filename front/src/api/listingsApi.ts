import { API_URL } from './config'
import type {
  IListingsResponse,
  ListingImportRequest,
  ListingImportReport,
} from '@/types/api'

export interface GetListingsParams {
  page: number
  pageSize: number
  search?: string
  source?: string
  signal?: AbortSignal
}

const buildQuery = (params: Omit<GetListingsParams, 'signal'>): string => {
  const searchParams = new URLSearchParams()
  searchParams.set('page', String(params.page))
  searchParams.set('pageSize', String(params.pageSize))

  if (params.search) {
    searchParams.set('search', params.search)
  }

  if (params.source) {
    searchParams.set('source', params.source)
  }

  return searchParams.toString()
}

export const listingsApi = {
  async getListings(params: GetListingsParams): Promise<IListingsResponse> {
    const { signal, ...rest } = params
    const query = buildQuery(rest)
    const response = await fetch(`${API_URL}/listings?${query}`, { signal })

    if (!response.ok) {
      throw new Error('Failed to load listings')
    }

    return response.json()
  },

  async importListings(payload: ListingImportRequest): Promise<ListingImportReport> {
    const response = await fetch(`${API_URL}/data/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => null)
      throw new Error(errorText || 'Failed to import listings')
    }

    return response.json()
  },

  async exportListingsCsv(params: { search?: string; source?: string; limit?: number; all?: boolean; fields?: string[] }) {
    const searchParams = new URLSearchParams()
    if (params.search) searchParams.set('search', params.search)
    if (params.source) searchParams.set('source', params.source)
    if (params.limit && Number.isFinite(params.limit)) {
      searchParams.set('limit', String(params.limit))
    }
    if (params.all) searchParams.set('all', '1')
    if (params.fields && params.fields.length > 0) {
      searchParams.set('fields', params.fields.join(','))
    }
    const query = searchParams.toString()
    const url = `${API_URL}/listings/export${query ? `?${query}` : ''}`
    const response = await fetch(url)
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(text || 'Failed to export listings')
    }
    const blob = await response.blob()
    const disposition = response.headers.get('Content-Disposition') || ''
    return { blob, disposition }
  },
}
