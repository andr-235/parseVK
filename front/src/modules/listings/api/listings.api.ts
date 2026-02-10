import toast from 'react-hot-toast'
import { API_URL } from '@/shared/api'
import { buildQueryString, createRequest, handleResponse } from '@/shared/api'
import type {
  IListing,
  IListingsResponse,
  ListingImportRequest,
  ListingImportReport,
  ListingUpdatePayload,
} from '@/shared/types'

export interface CreateListingPayload {
  url: string
  title?: string
  description?: string
  price?: number | null
  currency?: string
  source?: string
  address?: string
  city?: string
  rooms?: number | null
  areaTotal?: number | null
  floor?: number | null
  floorsTotal?: number | null
  contactName?: string
  contactPhone?: string
  publishedAt?: string | null
}

interface FetchListingsOptions {
  page: number
  pageSize: number
  search?: string
  source?: string
  archived?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  signal?: AbortSignal
}

interface ImportListingsOptions {
  file: File
  source: string
  updateExisting: boolean
}

const parseFileContent = async (file: File): Promise<unknown> => {
  try {
    const text = await file.text()
    return JSON.parse(text) as unknown
  } catch {
    throw new Error('Файл содержит некорректный JSON')
  }
}

const extractListings = (data: unknown): ListingImportRequest['listings'] => {
  if (Array.isArray(data)) {
    return data as ListingImportRequest['listings']
  }

  if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as { listings?: unknown }).listings)
  ) {
    return (data as { listings: ListingImportRequest['listings'] }).listings
  }

  throw new Error('Ожидается массив объявлений или объект с полем "listings"')
}

const ensureSource = (source: string): string => {
  const normalized = source.trim()
  if (!normalized) {
    throw new Error('Укажите источник объявлений перед загрузкой файла')
  }
  return normalized
}

export const listingsService = {
  async fetchListings(options: FetchListingsOptions): Promise<IListingsResponse> {
    try {
      const { signal, ...rest } = options
      const query = buildQueryString(rest)
      const response = await createRequest(`${API_URL}/listings?${query}`, { signal })

      return await handleResponse<IListingsResponse>(response, 'Failed to load listings')
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[listingsService] fetchListings error', error)
      }
      toast.error('Не удалось загрузить объявления')
      throw error
    }
  },

  async importFromJson(options: ImportListingsOptions): Promise<ListingImportReport> {
    try {
      const { file, source, updateExisting } = options
      const resolvedSource = ensureSource(source)

      const content = await parseFileContent(file)
      const listings = extractListings(content)

      if (listings.length === 0) {
        throw new Error('Файл не содержит объявлений для импорта')
      }

      const normalizedListings = listings.map((item, index) => {
        if (!item || typeof item !== 'object') {
          throw new Error(`Элемент №${index + 1} не является объектом объявления`)
        }

        return {
          ...(item as ListingImportRequest['listings'][0]),
          source: resolvedSource,
        }
      })

      const response = await createRequest(`${API_URL}/data/import`, {
        method: 'POST',
        body: JSON.stringify({ listings: normalizedListings, updateExisting }),
      })

      const report = await handleResponse<ListingImportReport>(
        response,
        'Failed to import listings'
      )

      const summary: string[] = []
      if (report.created > 0) {
        summary.push(`создано ${report.created}`)
      }
      if (report.updated > 0) {
        summary.push(`обновлено ${report.updated}`)
      }
      if (report.skipped > 0) {
        summary.push(`пропущено ${report.skipped}`)
      }

      toast.success(
        summary.length > 0 ? `Импорт завершён: ${summary.join(', ')}` : 'Импорт выполнен'
      )

      if (report.failed > 0) {
        toast.error(`Не удалось импортировать ${report.failed} объявлений`)
      }

      return report
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[listingsService] importFromJson error', error)
      }
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка импорта'
      toast.error(message)
      throw error
    }
  },

  async exportCsv(params: {
    search?: string
    source?: string
    limit?: number
    all?: boolean
    fields?: string[]
  }) {
    try {
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
      const response = await createRequest(url)

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(text || 'Failed to export listings')
      }

      const blob = await response.blob()
      const disposition = response.headers.get('Content-Disposition') || ''
      const urlObj = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = urlObj
      a.download = (() => {
        let filename = 'listings.csv'
        const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition ?? '')
        const encoded = match?.[1] || null
        const simple = match?.[2] || null
        if (encoded) {
          try {
            filename = decodeURIComponent(encoded)
          } catch {
            filename = encoded
          }
        } else if (simple) {
          filename = simple
        }
        return filename
      })()
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(urlObj)
      toast.success('Экспорт выполнен')
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[listingsService] exportCsv error', error)
      }
      const message = error instanceof Error ? error.message : 'Не удалось выгрузить CSV'
      toast.error(message)
      throw error
    }
  },

  async updateListing(id: number, payload: ListingUpdatePayload): Promise<IListing> {
    try {
      const response = await createRequest(`${API_URL}/listings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })

      const result = await handleResponse<IListing>(response, 'Failed to update listing')
      toast.success('Объявление обновлено')
      return result
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[listingsService] updateListing error', error)
      }
      const message = error instanceof Error ? error.message : 'Не удалось обновить объявление'
      toast.error(message)
      throw error
    }
  },

  async archiveListing(id: number): Promise<IListing> {
    try {
      const result = await this.updateListing(id, { archived: true })
      toast.success('Объявление отправлено в архив')
      return result
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[listingsService] archiveListing error', error)
      }
      const message = error instanceof Error ? error.message : 'Не удалось отправить в архив'
      toast.error(message)
      throw error
    }
  },

  async createListing(payload: CreateListingPayload): Promise<void> {
    try {
      const item: ListingImportRequest['listings'][0] = {
        url: payload.url,
        title: payload.title ?? null,
        description: payload.description ?? null,
        price: payload.price ?? null,
        currency: payload.currency ?? null,
        source: payload.source ?? null,
        address: payload.address ?? null,
        city: payload.city ?? null,
        rooms: payload.rooms ?? null,
        areaTotal: payload.areaTotal ?? null,
        floor: payload.floor ?? null,
        floorsTotal: payload.floorsTotal ?? null,
        contactName: payload.contactName ?? null,
        contactPhone: payload.contactPhone ?? null,
        publishedAt: payload.publishedAt ?? null,
        sourceParsedAt: new Date().toISOString(),
      }

      const response = await createRequest(`${API_URL}/data/import`, {
        method: 'POST',
        body: JSON.stringify({ listings: [item], updateExisting: false }),
      })

      await handleResponse<ListingImportReport>(response, 'Failed to create listing')
      toast.success('Объявление добавлено')
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[listingsService] createListing error', error)
      }
      const message = error instanceof Error ? error.message : 'Не удалось добавить объявление'
      toast.error(message)
      throw error
    }
  },

  async deleteListing(id: number): Promise<void> {
    try {
      const response = await createRequest(`${API_URL}/listings/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(text || 'Failed to delete listing')
      }

      toast.success('Объявление удалено')
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[listingsService] deleteListing error', error)
      }
      const message = error instanceof Error ? error.message : 'Не удалось удалить объявление'
      toast.error(message)
      throw error
    }
  },
}
