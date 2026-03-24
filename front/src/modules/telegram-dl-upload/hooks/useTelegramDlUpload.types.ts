import type {
  TelegramDlImportContact,
  TelegramDlImportFile,
  TelegramDlImportUploadResponse,
  TelegramDlMatchResult,
  TelegramDlMatchRun,
} from '@/modules/telegram-dl-upload/api/telegramDlUpload.api'

export interface UseTelegramDlUploadResult {
  files: TelegramDlImportFile[]
  isFilesLoading: boolean
  filesError: unknown
  uploadFiles: (files: File[]) => Promise<TelegramDlImportUploadResponse>
  isUploading: boolean
  uploadError: unknown
  uploadResult: TelegramDlImportUploadResponse | undefined
  contacts: TelegramDlImportContact[]
  isContactsLoading: boolean
  contactsError: unknown
  matchRuns: TelegramDlMatchRun[]
  isMatchRunsLoading: boolean
  matchRunsError: unknown
  activeMatchRun: TelegramDlMatchRun | null
  matchResults: TelegramDlMatchResult[]
  isMatchRunLoading: boolean
  matchRunError: unknown
  displayMode: 'contacts' | 'results'
  showContacts: () => void
  runMatch: () => Promise<TelegramDlMatchRun>
  isCreatingMatchRun: boolean
  exportActiveRun: () => Promise<void>
  isExportingMatchRun: boolean
}
