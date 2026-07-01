import { Download, RefreshCw } from 'lucide-react'
import { Button } from '../../../components/ui'
import type { FriendsExportStreamState } from '../../../shared/hooks/useFriendsExportStream'

type ExportResultsPanelProps = {
  stream: FriendsExportStreamState
  onDownload: () => void
  onReset: () => void
}

export function ExportResultsPanel({ stream, onDownload, onReset }: ExportResultsPanelProps) {
  const canDownload = stream.status === 'done'

  return (
    <section className="rounded-lg border border-border bg-bg-panel">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-medium text-text-primary">Результаты</h2>
      </div>

      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-muted">
          {canDownload ? 'Файл готов к скачиванию.' : 'Файлы появятся после завершения экспорта.'}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button id="export-download-btn" variant="primary" onClick={onDownload} disabled={!canDownload} icon={<Download size={16} aria-hidden="true" />}>
            Скачать XLSX
          </Button>
          <Button variant="secondary" onClick={onReset} icon={<RefreshCw size={16} aria-hidden="true" />}>
            {canDownload ? 'Новый экспорт' : stream.status === 'error' ? 'Повторить' : 'Сбросить'}
          </Button>
        </div>
      </div>
    </section>
  )
}
