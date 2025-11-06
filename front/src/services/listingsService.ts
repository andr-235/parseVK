import toast from 'react-hot-toast'
import { listingsApi } from '@/api/listingsApi'
import type {
  IListingsResponse,
  ListingImportItem,
  ListingImportReport,
} from '@/types/api'

interface FetchListingsOptions {
  page: number
  pageSize: number
  search?: string
  source?: string
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

const extractListings = (data: unknown): ListingImportItem[] => {
  if (Array.isArray(data)) {
    return data as ListingImportItem[]
  }

  if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as { listings?: unknown }).listings)
  ) {
    return (data as { listings: ListingImportItem[] }).listings
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
      return await listingsApi.getListings(options)
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

      const normalizedListings: ListingImportItem[] = listings.map((item, index) => {
        if (!item || typeof item !== 'object') {
          throw new Error(`Элемент №${index + 1} не является объектом объявления`)
        }

        return {
          ...(item as ListingImportItem),
          source: resolvedSource,
        }
      })

      const report = await listingsApi.importListings({
        listings: normalizedListings,
        updateExisting,
      })

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
        summary.length > 0
          ? `Импорт завершён: ${summary.join(', ')}`
          : 'Импорт выполнен',
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
}
