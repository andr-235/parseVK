import type { TelegramDlImportFile } from '@/modules/telegram-dl-upload/api/telegramDlUpload.api'
import SectionCard from '@/shared/components/SectionCard'

interface TelegramDlUploadHistoryProps {
  files: TelegramDlImportFile[]
  isLoading: boolean
}

export default function TelegramDlUploadHistory({
  files,
  isLoading,
}: TelegramDlUploadHistoryProps) {
  return (
    <SectionCard
      title="История загрузок"
      description="Последние импортированные файлы, пропущенные дубликаты и активные версии появятся здесь."
      className="border border-white/10 bg-slate-900/80 backdrop-blur-2xl"
      headerClassName="border-white/10"
      contentClassName="space-y-4"
    >
      {isLoading ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-slate-800/30 px-4 py-10 text-center">
          <div className="text-base font-medium text-white">Загружаю историю</div>
          <div className="mt-2 text-sm text-slate-400">Получаю историю файлов из tgmbase.</div>
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-slate-800/30 px-4 py-10 text-center">
          <div className="text-base font-medium text-white">Пока нет загруженных файлов</div>
          <div className="mt-2 text-sm text-slate-400">
            После первой выгрузки здесь появится список файлов, дата загрузки и статус обработки.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="rounded-lg border border-white/10 bg-slate-800/30 px-4 py-3 text-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-white">{file.originalFileName}</span>
                <span
                  className={
                    file.status === 'FAILED'
                      ? 'text-rose-300'
                      : file.status === 'SKIPPED'
                        ? 'text-amber-300'
                        : file.isActive
                          ? 'text-emerald-300'
                          : 'text-slate-400'
                  }
                >
                  {file.status === 'FAILED'
                    ? 'Ошибка'
                    : file.status === 'SKIPPED'
                      ? 'Пропущена'
                      : file.isActive
                        ? 'Активная'
                        : 'Архивная'}
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Статус: {file.status} • Строк: {file.rowsSuccess}/{file.rowsTotal}
              </div>
              {file.error ? <div className="mt-1 text-xs text-rose-300">{file.error}</div> : null}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
