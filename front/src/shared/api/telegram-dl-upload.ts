import { apiGet, apiPostMultipart } from './client'

export type DlImportBatchStatus = 'running' | 'done' | 'failed'

export type DlImportBatch = {
  id: string
  createdAt: string
  status: DlImportBatchStatus
  filesTotal: number
  filesSuccess: number
  filesFailed: number
}

export type DlImportFileStatus = 'running' | 'done' | 'failed'

export type DlImportFile = {
  id: string
  batchId: string
  originalFileName: string
  fileHash: string
  status: DlImportFileStatus
  rowsTotal: number
  rowsSuccess: number
  rowsFailed: number
  replacedFileId: string | null
  createdAt: string
  finishedAt: string | null
  error: string | null
  isActive: boolean
}

export type DlContact = {
  id: string
  importFileId: string
  telegramId: string
  username: string | null
  phone: string
  firstName: string | null
  lastName: string | null
  description: string | null
  region: string | null
  joinedAt: string
  channelsRaw: string | null
  fullName: string | null
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
  sourceRowIndex: number
  createdAt: string
}

export type DlContactsQueryParams = {
  fileId?: string
  fileName?: string
  activeOnly?: boolean
  search?: string
  page?: number
  limit?: number
}

export type DlContactsResponse = {
  items: DlContact[]
  total: number
}

/**
 * Upload one or more xlsx files for Telegram DL Import
 */
export async function uploadTelegramDlFiles(files: File[]): Promise<DlImportBatch> {
  const formData = new FormData()
  files.forEach((file) => {
    // Standard NestJS / Express multi-file upload field name is usually 'files'
    formData.append('files', file)
  })
  return apiPostMultipart<DlImportBatch>('/telegram/dl-import/upload', formData)
}

/**
 * Fetch list of imported files (upload history)
 */
export async function fetchTelegramDlFiles(): Promise<DlImportFile[]> {
  return apiGet<DlImportFile[]>('/telegram/dl-import/files')
}

/**
 * Fetch imported contacts with filtering and pagination
 */
export async function fetchTelegramDlContacts(params?: DlContactsQueryParams): Promise<DlContactsResponse> {
  const queryParams: Record<string, string | number | undefined> = {
    fileId: params?.fileId,
    fileName: params?.fileName,
    activeOnly: params?.activeOnly ? 'true' : undefined,
    search: params?.search || undefined,
    page: params?.page,
    limit: params?.limit,
  }
  return apiGet<DlContactsResponse>('/telegram/dl-import/contacts', queryParams)
}
