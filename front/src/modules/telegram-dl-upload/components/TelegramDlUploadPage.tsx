import { useTelegramDlUpload } from '@/modules/telegram-dl-upload/hooks/useTelegramDlUpload'
import TelegramDlUploadHero from './TelegramDlUploadHero'
import TelegramDlUploadCard from './TelegramDlUploadCard'
import TelegramDlUploadHistory from './TelegramDlUploadHistory'

export default function TelegramDlUploadPage() {
  const { files, isFilesLoading, uploadFiles, isUploading, uploadResult } = useTelegramDlUpload()

  return (
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <TelegramDlUploadHero />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <TelegramDlUploadCard
          isUploading={isUploading}
          uploadStatuses={uploadResult?.files ?? []}
          onSubmit={uploadFiles}
        />
        <TelegramDlUploadHistory files={files} isLoading={isFilesLoading} />
      </div>
    </div>
  )
}
