import { API_URL } from './config'
import { buildQueryString, createRequest, handleResponse } from './utils'
import type {
  IListing,
  IListingsResponse,
  ListingImportRequest,
  ListingImportReport,
  ListingUpdatePayload,
} from '@/types/api'

export interface GetListingsParams {
  page: number
  pageSize: number
  search?: string
  source?: string
  archived?: boolean
  signal?: AbortSignal
}

export const listingsApi = {
  async getListings(params: GetListingsParams): Promise<IListingsResponse> {
    const { signal, ...rest } = params
    const query = buildQueryString(rest)
    const response = await fetch(`${API_URL}/listings?${query}`, { signal })

    return handleResponse<IListingsResponse>(response, 'Failed to load listings')
  },

  async importListings(payload: ListingImportRequest): Promise<ListingImportReport> {
    const response = await createRequest(`${API_URL}/data/import`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    return handleResponse<ListingImportReport>(response, 'Failed to import listings')
  },

  async exportListingsCsv(params: {
    search?: string
    source?: string
    limit?: number
    all?: boolean
    fields?: string[]
  }) {
    const queryParams: Record<string, string> = {}

    if (params.search) {
      queryParams.search = params.search
    }
    if (params.source) {
      queryParams.source = params.source
    }
    if (params.limit && Number.isFinite(params.limit)) {
      queryParams.limit = String(params.limit)
    }
    if (params.all) {
      queryParams.all = '1'
    }
    if (params.fields && params.fields.length > 0) {
      queryParams.fields = params.fields.join(',')
    }

    const query = buildQueryString(queryParams)
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

  async updateListing(id: number, payload: ListingUpdatePayload): Promise<IListing> {
    const response = await createRequest(`${API_URL}/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })

    return handleResponse<IListing>(response, 'Failed to update listing')
  },
}
