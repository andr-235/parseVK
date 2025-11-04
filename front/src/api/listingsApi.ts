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
}

const buildQuery = (params: GetListingsParams): string => {
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
    const query = buildQuery(params)
    const response = await fetch(`${API_URL}/listings?${query}`)

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
}
