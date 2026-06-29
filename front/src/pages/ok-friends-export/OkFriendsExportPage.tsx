import { useState, useCallback, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Download, RefreshCw, Check, FileSpreadsheet } from 'lucide-react'
import { Button, FeedbackToast } from '../../components/ui'
import { Spinner } from '../../components/ui/Spinner'
import { PageShell } from '../../components/layout/PageShell'
import { useFeedback } from '../../shared/hooks/useFeedback'
import { useFriendsExportStream } from '../../shared/hooks/useFriendsExportStream'
import { startOkFriendsExport, downloadOkFriendsXlsx, getOkFriendsStreamUrl } from '../../shared/api/ok-friends'
import { OkExportForm } from './components/OkExportForm'

export function OkFriendsExportPage() {
  const [jobId, setJobId] = useState<string | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  const { feedback, showFeedback, dismissFeedback } = useFeedback()

  const stream = useFriendsExportStream(jobId, getOkFriendsStreamUrl)

  const exportMutation = useMutation({
    mutationFn: startOkFriendsExport,
    onSuccess: (data) => {
      console.log('[OkFriendsExport] job created:', data.jobId)
      setJobId(data.jobId)
    },
    onError: (err) => {
      console.warn('[OkFriendsExport] create error:', err)
      showFeedback('error', err instanceof Error ? err.message : 'Ошибка запуска экспорта')
    },
  })

  const handleExport = useCallback((fid: string) => {
    console.log('[OkFriendsExport] starting export for fid:', fid)
    exportMutation.mutate({ fid })
  }, [exportMutation])

  const handleDownload = useCallback(async () => {
    if (!jobId && !stream.xlsxPath) return
    const downloadJobId = jobId ?? ''
    console.log('[OkFriendsExport] download XLSX:', downloadJobId)
    try {
      const blob = await downloadOkFriendsXlsx(downloadJobId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ok_friends_export_${downloadJobId}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      showFeedback('success', 'Файл скачан')
    } catch (err) {
      console.warn('[OkFriendsExport] download error:', err)
      showFeedback('error', err instanceof Error ? err.message : 'Ошибка скачивания')
    }
  }, [jobId, stream.xlsxPath, showFeedback])

  const handleReset = useCallback(() => {
    console.log('[OkFriendsExport] reset')
    setJobId(null)
    stream.reset()
  }, [stream])

  useEffect(() => {
    if (stream.status === 'done') {
      console.log('[OkFriendsExport] stream done')
      showFeedback('success', 'Экспорт завершён')
    } else if (stream.status === 'error') {
      console.warn('[OkFriendsExport] stream error:', stream.error)
      showFeedback('error', stream.error || 'Ошибка экспорта')
    }
  }, [stream.status, stream.error, showFeedback])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [stream.logs])

  const progressPct = stream.progress.totalCount > 0
    ? Math.round((stream.progress.fetchedCount / stream.progress.totalCount) * 100)
    : 0

  return (
    <PageShell title="Экспорт друзей OK">
      <FeedbackToast feedback={feedback} onDismiss={dismissFeedback} />

      <div className="pb-5 mb-5 border-b border-border">
        <OkExportForm
          onSubmit={handleExport}
          disabled={stream.status === 'running' || stream.status === 'connecting'}
          isLoading={exportMutation.isPending}
        />
      </div>

      {stream.status === 'idle' && !exportMutation.isPending && (
        <p className="text-sm text-text-muted leading-relaxed max-w-prose">
          Введите ID пользователя Одноклассников и нажмите «Запустить экспорт».
          Ход выполнения будет отображаться ниже.
        </p>
      )}

      {(stream.status === 'connecting' || stream.status === 'running') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-medium text-text-primary">
            <Spinner size={16} />
            <span>Экспорт выполняется</span>
          </div>

          {stream.progress.totalCount > 0 && (
            <div className="space-y-1.5 max-w-sm">
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>Прогресс</span>
                <span className="font-mono tabular-nums">
                  {stream.progress.fetchedCount}&thinsp;/&thinsp;{stream.progress.totalCount}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-panel">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {stream.logs.length > 0 && (
            <details className="group">
              <summary className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted cursor-pointer hover:text-text-secondary transition-colors duration-150 select-none">
                Лог экспорта
                <span className="text-text-muted/60">{stream.logs.filter(e => e.type === 'log').length}</span>
              </summary>
              <div className="mt-2 max-h-40 overflow-y-auto rounded border border-border bg-bg-panel p-2 font-mono text-xs leading-relaxed">
                {stream.logs.map((event, i) => (
                  event.type === 'log' && (
                    <div key={i} className={`py-0.5 ${
                      event.data.level === 'error' ? 'text-danger' :
                      event.data.level === 'warn' ? 'text-warning' : 'text-text-secondary'
                    }`}>
                      {event.data.message}
                    </div>
                  )
                ))}
                <div ref={logEndRef} />
              </div>
            </details>
          )}
        </div>
      )}

      {stream.status === 'done' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-medium text-success">
            <Check size={16} />
            <span>Экспорт завершён</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <FileSpreadsheet size={16} />
            <span className="font-mono tabular-nums font-medium text-text-primary">
              {stream.progress.fetchedCount}
            </span>
            <span>записей собрано</span>
            {stream.progress.totalCount > 0 && (
              <span className="text-text-muted">из {stream.progress.totalCount}</span>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={handleDownload} icon={<Download size={14} />}>
              Скачать XLSX
            </Button>
            <Button variant="secondary" size="sm" onClick={handleReset} icon={<RefreshCw size={14} />}>
              Новый экспорт
            </Button>
          </div>
        </div>
      )}

      {stream.status === 'error' && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm text-danger">
            <span className="mt-0.5 shrink-0">✕</span>
            <span>{stream.error}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={handleReset} icon={<RefreshCw size={14} />}>
            Повторить
          </Button>
        </div>
      )}
    </PageShell>
  )
}
