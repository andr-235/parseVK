import { useState } from 'react'
import { useTelegramDlUpload } from '@/modules/telegram-dl-upload/hooks/useTelegramDlUpload'
import TelegramDlUploadHero from './TelegramDlUploadHero'
import TelegramDlTabs from './TelegramDlTabs'
import TelegramDlImportWorkspace from './TelegramDlImportWorkspace'
import TelegramDlMatchWorkspace from './TelegramDlMatchWorkspace'

export default function TelegramDlUploadPage() {
  const state = useTelegramDlUpload()
  const [activeTab, setActiveTab] = useState<'import' | 'match'>('import')
  const { files, isFilesLoading, uploadFiles, isUploading, uploadResult } = state

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 font-monitoring-body md:px-8">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <TelegramDlUploadHero />
      </div>

      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-75">
        <TelegramDlTabs activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        {activeTab === 'import' ? (
          <TelegramDlImportWorkspace
            files={files}
            isFilesLoading={isFilesLoading}
            isUploading={isUploading}
            uploadStatuses={uploadResult?.files ?? []}
            onSubmit={uploadFiles}
          />
        ) : (
          <TelegramDlMatchWorkspace state={state} />
        )}
      </div>
    </div>
  )
}
