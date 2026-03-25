import type {
  TelegramDlImportContact,
  TelegramDlImportContactsPage,
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
  contactsPage: TelegramDlImportContactsPage
  contacts: TelegramDlImportContact[]
  contactsTotal: number
  contactsPageIndex: number
  contactsPageCount: number
  contactsPageSize: number
  isContactsLoading: boolean
  contactsError: unknown
  setContactsFileFilter: (value: string) => void
  setContactsTelegramIdFilter: (value: string) => void
  setContactsUsernameFilter: (value: string) => void
  setContactsPhoneFilter: (value: string) => void
  contactsFileFilter: string
  contactsTelegramIdFilter: string
  contactsUsernameFilter: string
  contactsPhoneFilter: string
  goToNextContactsPage: () => void
  goToPreviousContactsPage: () => void
  canGoToNextContactsPage: boolean
  canGoToPreviousContactsPage: boolean
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
