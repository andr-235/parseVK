import { useState, type ChangeEvent } from 'react'
import { Upload } from 'lucide-react'
import FileUpload from '@/shared/components/FileUpload'
import SectionCard from '@/shared/components/SectionCard'
import { Button } from '@/shared/ui/button'
import type { TelegramDlImportFile } from '@/modules/telegram-dl-upload/api/telegramDlUpload.api'

const XLSX_ACCEPT = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

interface TelegramDlUploadCardProps {
  isUploading: boolean
  uploadStatuses: TelegramDlImportFile[]
  onSubmit: (files: File[]) => Promise<unknown>
}

export default function TelegramDlUploadCard({
  isUploading,
  uploadStatuses,
  onSubmit,
}: TelegramDlUploadCardProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleFilesSelect = async (files: File[]) => {
    setSelectedFiles(files)
  }

  const handleLegacyUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length > 0) {
      setSelectedFiles(files)
    }
  }

  const handleClear = () => {
    setSelectedFiles([])
  }

  const handleSubmit = async () => {
    if (selectedFiles.length === 0 || isUploading) {
      return
    }

    await onSubmit(selectedFiles)
    setSelectedFiles([])
  }

  return (
    <SectionCard
      title="Загрузка файлов"
      description="Выберите один или несколько XLSX файлов и проверьте список перед отправкой."
      className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl"
      headerClassName="border-white/10"
      contentClassName="space-y-6"
    >
      <div className="space-y-4">
        <FileUpload
          accept={XLSX_ACCEPT}
          multiple
          autoReset={false}
          variant="dropzone"
          dropzoneText="Перетащите XLSX сюда или нажмите, чтобы выбрать несколько файлов"
          buttonText="Выбрать XLSX"
          buttonVariant="outline"
          className="w-full"
          onFilesSelect={handleFilesSelect}
          onUpload={handleLegacyUpload}
        />

        <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
          <span>Выбрано файлов: {selectedFiles.length}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={selectedFiles.length === 0}
            className="h-8 text-slate-300 hover:text-white"
          >
            Очистить
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Upload className="size-4" />
          Файлы в очереди
        </div>

        {selectedFiles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-slate-800/30 px-4 py-6 text-sm text-slate-400">
            Пока файлы не выбраны.
          </div>
        ) : (
          <div className="space-y-2">
            {selectedFiles.map((file) => (
              <div
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-slate-800/30 px-4 py-3 text-sm"
              >
                <span className="truncate text-white">{file.name}</span>
                <span className="shrink-0 text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25"
          disabled={selectedFiles.length === 0 || isUploading}
          onClick={() => void handleSubmit()}
        >
          {isUploading ? 'Загрузка...' : 'Загрузить в tgmbase'}
        </Button>

        {uploadStatuses.length > 0 ? (
          <div className="space-y-2">
            {uploadStatuses.map((file) => (
              <div
                key={file.id}
                className="rounded-lg border border-white/10 bg-slate-800/30 px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-white">{file.originalFileName}</span>
                  <span className="shrink-0 text-cyan-300">{file.status}</span>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Строк: {file.rowsSuccess}/{file.rowsTotal}
                  {file.replacedFileId ? ' • заменила предыдущую версию' : ''}
                </div>
                {file.error ? <div className="mt-1 text-xs text-rose-300">{file.error}</div> : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            После отправки здесь появятся статусы обработки по каждому файлу.
          </p>
        )}
      </div>
    </SectionCard>
  )
}
