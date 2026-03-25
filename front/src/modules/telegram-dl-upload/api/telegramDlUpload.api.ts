import toast from 'react-hot-toast'
import { API_URL, createRequest, handleResponse } from '@/shared/api'
import { saveReportBlob } from '@/shared/utils'

const UPLOAD_CHUNK_SIZE = 20

const DEFAULT_MATCH_EXPORT_NAME = 'telegram_dl_match.xlsx'

const extractFilename = (disposition: string | null, fallback: string): string => {
  if (!disposition) {
    return fallback
  }

  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition)
  const encodedName = match?.[1]
  const simpleName = match?.[2]

  if (encodedName) {
    try {
      return decodeURIComponent(encodedName)
    } catch {
      return encodedName
    }
  }

  return simpleName || fallback
}

export interface TelegramDlImportBatch {
  id: string
  status: string
  filesTotal: number
  filesSuccess: number
  filesFailed: number
}

export interface TelegramDlImportFile {
  id: string
  originalFileName: string
  status: string
  rowsTotal: number
  rowsSuccess: number
  rowsFailed: number
  isActive: boolean
  replacedFileId: string | null
  error: string | null
}

export interface TelegramDlImportUploadResponse {
  batch: TelegramDlImportBatch
  files: TelegramDlImportFile[]
}

export interface TelegramDlImportContact {
  id: string
  importFileId: string | null
  originalFileName: string
  telegramId: string | null
  username: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  fullName: string | null
  region: string | null
  sourceRowIndex: number
  description: string | null
  joinedAt: string | null
  address: string | null
  vkUrl: string | null
  email: string | null
  telegramContact: string | null
  instagram: string | null
  viber: string | null
  odnoklassniki: string | null
  birthDateText: string | null
  usernameExtra: string | null
  geo: string | null
  createdAt: string
}

export interface TelegramDlImportContactsQuery {
  fileName?: string
  telegramId?: string
  username?: string
  phone?: string
  limit?: number
  offset?: number
}

export interface TelegramDlImportContactsPage {
  items: TelegramDlImportContact[]
  total: number
  limit: number
  offset: number
}

export interface TelegramDlMatchRun {
  id: string
  status: 'RUNNING' | 'DONE' | 'FAILED'
  contactsTotal: number
  matchesTotal: number
  strictMatchesTotal: number
  usernameMatchesTotal: number
  phoneMatchesTotal: number
  createdAt: string
  finishedAt: string | null
  error: string | null
}

export interface TelegramDlMatchResultContact {
  id: string
  importFileId: string
  originalFileName: string
  telegramId: string | null
  username: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  fullName: string | null
  region: string | null
  sourceRowIndex: number
}

export interface TelegramDlMatchResultUser {
  id: string
  user_id: string
  bot: boolean
  scam: boolean
  premium: boolean
  first_name: string | null
  last_name: string | null
  username: string | null
  phone: string | null
  upd_date: string | null
  relatedChats?: Array<{
    type: 'group' | 'supergroup' | 'channel'
    peer_id: string
    title: string
  }>
}

export interface TelegramDlMatchResult {
  id: string
  runId: string
  dlContactId: string
  tgmbaseUserId: string | null
  strictTelegramIdMatch: boolean
  usernameMatch: boolean
  phoneMatch: boolean
  createdAt: string
  dlContact: TelegramDlMatchResultContact
  user: TelegramDlMatchResultUser | null
}

const chunkFiles = (files: File[], chunkSize: number): File[][] => {
  const chunks: File[][] = []

  for (let index = 0; index < files.length; index += chunkSize) {
    chunks.push(files.slice(index, index + chunkSize))
  }

  return chunks
}

const createFailedFileResult = (file: File, error: string): TelegramDlImportFile => ({
  id: `failed:${file.name}:${file.lastModified}`,
  originalFileName: file.name,
  status: 'FAILED',
  rowsTotal: 0,
  rowsSuccess: 0,
  rowsFailed: 0,
  isActive: false,
  replacedFileId: null,
  error,
})

const buildContactsQueryString = (params: TelegramDlImportContactsQuery = {}) => {
  const search = new URLSearchParams()

  if (params.fileName?.trim()) {
    search.set('fileName', params.fileName.trim())
  }
  if (params.telegramId?.trim()) {
    search.set('telegramId', params.telegramId.trim())
  }
  if (params.username?.trim()) {
    search.set('username', params.username.trim())
  }
  if (params.phone?.trim()) {
    search.set('phone', params.phone.trim())
  }
  if (typeof params.limit === 'number') {
    search.set('limit', String(params.limit))
  }
  if (typeof params.offset === 'number') {
    search.set('offset', String(params.offset))
  }

  const query = search.toString()
  return query ? `?${query}` : ''
}

export const telegramDlUploadService = {
  async upload(files: File[]): Promise<TelegramDlImportUploadResponse> {
    const chunks = chunkFiles(files, UPLOAD_CHUNK_SIZE)
    const uploadedFiles: TelegramDlImportFile[] = []
    const batchIds: string[] = []

    for (const chunk of chunks) {
      const formData = new FormData()
      chunk.forEach((file) => formData.append('files', file))

      try {
        const response = await createRequest(`${API_URL}/telegram/dl-import/upload`, {
          method: 'POST',
          body: formData,
        })

        const result = await handleResponse<TelegramDlImportUploadResponse>(
          response,
          'Не удалось загрузить выгрузку с ДЛ'
        )

        batchIds.push(result.batch.id)
        uploadedFiles.push(...result.files)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Неизвестная ошибка загрузки'
        uploadedFiles.push(...chunk.map((file) => createFailedFileResult(file, message)))
      }
    }

    const filesSuccess = uploadedFiles.filter((file) => file.status !== 'FAILED').length
    const filesFailed = uploadedFiles.length - filesSuccess
    const status = filesFailed === 0 ? 'DONE' : filesSuccess === 0 ? 'FAILED' : 'PARTIAL'

    const result = {
      batch: {
        id: batchIds.at(-1) ?? 'combined',
        status,
        filesTotal: uploadedFiles.length,
        filesSuccess,
        filesFailed,
      },
      files: uploadedFiles,
    }

    if (filesFailed === 0) {
      toast.success('Выгрузка с ДЛ загружена')
    } else if (filesSuccess === 0) {
      toast.error(`Не удалось загрузить файлы: ${filesFailed}`)
    } else {
      toast.error(`Частично загружено: ${filesSuccess} успешно, ${filesFailed} с ошибкой`)
    }

    return result
  },

  async getFiles(): Promise<TelegramDlImportFile[]> {
    const filesResponse = await createRequest(`${API_URL}/telegram/dl-import/files`)
    return handleResponse<TelegramDlImportFile[]>(
      filesResponse,
      'Не удалось загрузить историю выгрузок'
    )
  },

  async getContacts(
    params: TelegramDlImportContactsQuery = {}
  ): Promise<TelegramDlImportContactsPage> {
    try {
      const response = await createRequest(
        `${API_URL}/telegram/dl-import/contacts${buildContactsQueryString(params)}`
      )
      return await handleResponse<TelegramDlImportContactsPage>(
        response,
        'Не удалось загрузить контакты DL'
      )
    } catch (error) {
      toast.error('Не удалось загрузить контакты DL')
      throw error
    }
  },

  async getMatchRuns(): Promise<TelegramDlMatchRun[]> {
    try {
      const response = await createRequest(`${API_URL}/telegram/dl-match/runs`)
      return await handleResponse<TelegramDlMatchRun[]>(
        response,
        'Не удалось загрузить запуски матчинга'
      )
    } catch (error) {
      toast.error('Не удалось загрузить запуски матчинга')
      throw error
    }
  },

  async getMatchRun(runId: string): Promise<TelegramDlMatchRun> {
    try {
      const response = await createRequest(`${API_URL}/telegram/dl-match/runs/${runId}`)
      return await handleResponse<TelegramDlMatchRun>(
        response,
        'Не удалось загрузить запуск матчинга'
      )
    } catch (error) {
      toast.error('Не удалось загрузить запуск матчинга')
      throw error
    }
  },

  async getMatchResults(runId: string): Promise<TelegramDlMatchResult[]> {
    try {
      const response = await createRequest(`${API_URL}/telegram/dl-match/runs/${runId}/results`)
      return await handleResponse<TelegramDlMatchResult[]>(
        response,
        'Не удалось загрузить результаты матчинга'
      )
    } catch (error) {
      toast.error('Не удалось загрузить результаты матчинга')
      throw error
    }
  },

  async createMatchRun(): Promise<TelegramDlMatchRun> {
    try {
      const response = await createRequest(`${API_URL}/telegram/dl-match/runs`, {
        method: 'POST',
      })
      const run = await handleResponse<TelegramDlMatchRun>(
        response,
        'Не удалось запустить матчинг DL'
      )
      toast.success('Матчинг DL завершен')
      return run
    } catch (error) {
      toast.error('Не удалось запустить матчинг DL')
      throw error
    }
  },

  async exportMatchRun(runId: string): Promise<void> {
    try {
      const response = await createRequest(`${API_URL}/telegram/dl-match/runs/${runId}/export`)

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(text || 'Не удалось выгрузить результат матчинга')
      }

      const blob = await response.blob()
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty')
      }

      const fallbackName = DEFAULT_MATCH_EXPORT_NAME
      const filename = extractFilename(response.headers.get('Content-Disposition'), fallbackName)
      saveReportBlob(blob, filename)
      toast.success('Результат матчинга сохранён')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Не удалось выгрузить результат матчинга'
      toast.error(message)
      throw error
    }
  },
}
