import toast from 'react-hot-toast'
import { API_URL, createRequest, handleResponse } from '@/shared/api'

const UPLOAD_CHUNK_SIZE = 20

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
}
