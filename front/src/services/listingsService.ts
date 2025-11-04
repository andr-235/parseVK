import toast from 'react-hot-toast'
import { listingsApi } from '@/api/listingsApi'
import type {
  IListingsResponse,
  ListingImportItem,
  ListingImportReport,
} from '@/types/api'

const STORAGE_KEY = 'listings:dataImportApiKey'

let dataImportApiKey = (import.meta.env.VITE_DATA_IMPORT_API_KEY ?? '').trim()

const readStoredApiKey = (): string => {
  if (typeof window === 'undefined') {
    return ''
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY)
    return storedValue?.trim() ?? ''
  } catch {
    return ''
  }
}

const getImportApiKey = (): string => {
  if (!dataImportApiKey) {
    dataImportApiKey = readStoredApiKey()
  }

  return dataImportApiKey
}

const hasImportApiKey = (): boolean => getImportApiKey().length > 0

const persistApiKey = (value: string): void => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, value)
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Игнорируем ошибки доступа к хранилищу браузера
  }
}

const setImportApiKey = (value: string): void => {
  dataImportApiKey = value.trim()
  persistApiKey(dataImportApiKey)
}

const ensureImportApiKey = (): string => {
  const apiKey = getImportApiKey()

  if (!apiKey) {
    throw new Error('API ключ импорта не настроен. Укажите VITE_DATA_IMPORT_API_KEY.')
  }

  return apiKey
}

interface FetchListingsOptions {
  page: number
  pageSize: number
  search?: string
  source?: string
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

      const report = await listingsApi.importListings(
        { listings: normalizedListings, updateExisting },
        ensureImportApiKey(),
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

  getImportApiKey,
  setImportApiKey,
  hasImportApiKey,
}
