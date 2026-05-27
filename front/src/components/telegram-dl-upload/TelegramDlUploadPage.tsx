import { useState } from 'react'
import { useTelegramDlUpload } from '@/hooks/telegram-dl-upload/useTelegramDlUpload'
import { PageHeader } from '@/components/common'
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
        <PageHeader
          variant="hero"
          title="Выгрузка с ДЛ"
          description="Загружайте несколько XLSX файлов формата groupexport_*.xlsx за один раз. Повторная загрузка с тем же именем файла будет пропущена как дубликат."
          footer={
            <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
              <span className="rounded-full border border-border/60 bg-background-primary/70 px-3 py-1.5">
                Можно выбрать несколько XLSX файлов
              </span>
              <span className="rounded-full border border-border/60 bg-background-primary/70 px-3 py-1.5">
                Дубликаты пропускаются по полному имени файла
              </span>
            </div>
          }
          className="py-1"
        />
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
