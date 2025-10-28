import { API_URL } from './config'
import type {
  RealEstateFilters,
  RealEstateListingsResponse,
  RealEstateReportFormat,
} from '@/types/realEstate'

const serializeFilters = (filters: RealEstateFilters): URLSearchParams => {
  const params = new URLSearchParams()

  if (filters.period && filters.period !== 'all') {
    params.set('period', filters.period)
  }

  if (filters.sources.length > 0) {
    params.set('sources', filters.sources.join(','))
  }

  if (filters.onlyNew) {
    params.set('onlyNew', 'true')
  }

  return params
}

const normalizeResponse = (
  payload: RealEstateListingsResponse,
): RealEstateListingsResponse => {
  const items = Array.isArray(payload.items) ? payload.items : []

  return {
    items,
    summary: payload.summary ?? null,
    generatedAt: payload.generatedAt ?? null,
  }
}

export const realEstateListingsApi = {
  async fetchListings(filters: RealEstateFilters): Promise<RealEstateListingsResponse> {
    const params = serializeFilters(filters)
    const query = params.toString()
    const url = `${API_URL}/real-estate/listings${query ? `?${query}` : ''}`

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (response.status === 204 || response.status === 404) {
      return { items: [], summary: null, generatedAt: null }
    }

    if (!response.ok) {
      throw new Error('Не удалось загрузить объявления')
    }

    const data = (await response.json()) as RealEstateListingsResponse
    return normalizeResponse(data)
  },

  async exportReport(
    filters: RealEstateFilters,
    format: RealEstateReportFormat = 'xlsx',
  ): Promise<Blob> {
    const params = serializeFilters(filters)
    params.set('format', format)

    const query = params.toString()
    const url = `${API_URL}/real-estate/report${query ? `?${query}` : ''}`

    const response = await fetch(url, {
      headers: {
        Accept: 'application/octet-stream',
      },
    })

    if (!response.ok) {
      throw new Error('Не удалось сформировать отчёт')
    }

    return response.blob()
  },
}
