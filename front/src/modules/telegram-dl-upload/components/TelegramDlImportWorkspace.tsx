import TelegramDlUploadCard from './TelegramDlUploadCard'
import TelegramDlUploadHistory from './TelegramDlUploadHistory'
import type { TelegramDlImportFile } from '../api/telegramDlUpload.api'

interface TelegramDlImportWorkspaceProps {
  files: TelegramDlImportFile[]
  isFilesLoading: boolean
  isUploading: boolean
  uploadStatuses: TelegramDlImportFile[]
  onSubmit: (files: File[]) => Promise<unknown>
}

export default function TelegramDlImportWorkspace({
  files,
  isFilesLoading,
  isUploading,
  uploadStatuses,
  onSubmit,
}: TelegramDlImportWorkspaceProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <TelegramDlUploadCard
        isUploading={isUploading}
        uploadStatuses={uploadStatuses}
        onSubmit={onSubmit}
      />
      <TelegramDlUploadHistory files={files} isLoading={isFilesLoading} />
    </div>
  )
}
