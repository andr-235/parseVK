import toast from 'react-hot-toast'
import { API_URL, createRequest, handleResponse } from '@/shared/api'

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

export const telegramDlUploadService = {
  async upload(files: File[]): Promise<TelegramDlImportUploadResponse> {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))

    try {
      const response = await createRequest(`${API_URL}/telegram/dl-import/upload`, {
        method: 'POST',
        body: formData,
      })

      const result = await handleResponse<TelegramDlImportUploadResponse>(
        response,
        'Не удалось загрузить выгрузку с ДЛ'
      )
      toast.success('Выгрузка с ДЛ загружена')
      return result
    } catch (error) {
      toast.error('Не удалось загрузить выгрузку с ДЛ')
      throw error
    }
  },

  async getFiles(): Promise<TelegramDlImportFile[]> {
    const response = await createRequest(`${API_URL}/telegram/dl-import/files?activeOnly=true`)
    return handleResponse<TelegramDlImportFile[]>(response, 'Не удалось загрузить историю выгрузок')
  },
}
