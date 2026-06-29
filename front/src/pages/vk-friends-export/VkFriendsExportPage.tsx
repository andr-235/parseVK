import { useState, useCallback, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Download, RefreshCw, Check } from 'lucide-react'
import { Button, FeedbackToast } from '../../components/ui'
import { Spinner } from '../../components/ui/Spinner'
import { PageShell } from '../../components/layout/PageShell'
import { useFeedback } from '../../shared/hooks/useFeedback'
import { useFriendsExportStream } from '../../shared/hooks/useFriendsExportStream'
import { startVkFriendsExport, downloadVkFriendsXlsx, getVkFriendsStreamUrl } from '../../shared/api/vk-friends'
import { VkExportForm } from './components/VkExportForm'

export function VkFriendsExportPage() {
  const [jobId, setJobId] = useState<string | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  const { feedback, showFeedback, dismissFeedback } = useFeedback()

  const stream = useFriendsExportStream(jobId, getVkFriendsStreamUrl)

  const exportMutation = useMutation({
    mutationFn: startVkFriendsExport,
    onSuccess: (data) => {
      console.log('[VkFriendsExport] job created:', data.jobId)
      setJobId(data.jobId)
    },
    onError: (err) => {
      console.warn('[VkFriendsExport] create error:', err)
      showFeedback('error', err instanceof Error ? err.message : 'Ошибка запуска экспорта')
    },
  })

  const handleExport = useCallback((user_id: number) => {
    console.log('[VkFriendsExport] starting export for user_id:', user_id)
    exportMutation.mutate({ user_id })
  }, [exportMutation])

  const handleDownload = useCallback(async () => {
    if (!jobId && !stream.xlsxPath) return
    const downloadJobId = jobId ?? ''
    console.log('[VkFriendsExport] download XLSX:', downloadJobId)
    try {
      const blob = await downloadVkFriendsXlsx(downloadJobId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vk_friends_export_${downloadJobId}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      showFeedback('success', 'Файл скачан')
    } catch (err) {
      console.warn('[VkFriendsExport] download error:', err)
      showFeedback('error', err instanceof Error ? err.message : 'Ошибка скачивания')
    }
  }, [jobId, stream.xlsxPath, showFeedback])

  const handleReset = useCallback(() => {
    console.log('[VkFriendsExport] reset')
    setJobId(null)
    stream.reset()
  }, [stream])

  useEffect(() => {
    if (stream.status === 'done') {
      console.log('[VkFriendsExport] stream done')
      showFeedback('success', 'Экспорт завершён')
    } else if (stream.status === 'error') {
      console.warn('[VkFriendsExport] stream error:', stream.error)
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
    <PageShell title="Экспорт друзей VK">
      <FeedbackToast feedback={feedback} onDismiss={dismissFeedback} />

      <div className="bg-bg-panel rounded-lg p-4 mb-8">
        <VkExportForm
          onSubmit={handleExport}
          disabled={stream.status === 'running' || stream.status === 'connecting'}
          isLoading={exportMutation.isPending}
        />
      </div>

      {stream.status === 'running' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Spinner size={14} />
              <span className="text-sm font-medium text-text-primary">Выполняется</span>
            </div>
            {stream.progress.totalCount > 0 && (
              <span className="text-xs tabular-nums text-text-muted">
                {stream.progress.fetchedCount}&thinsp;/&thinsp;{stream.progress.totalCount}
              </span>
            )}
          </div>
          {stream.progress.totalCount > 0 && (
            <div className="h-1 bg-bg-panel rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
          {stream.logs.length > 0 && (
            <details className="group">
              <summary className="text-xs text-text-muted cursor-pointer hover:text-text-secondary transition-colors select-none">
                Лог · {stream.logs.filter(e => e.type === 'log').length}
              </summary>
              <div className="mt-3 max-h-48 overflow-y-auto font-mono text-xs leading-relaxed text-text-secondary space-y-1">
                {stream.logs.map((event, i) => (
                  event.type === 'log' && (
                    <div key={i} className={`${
                      event.data.level === 'error' ? 'text-danger' :
                      event.data.level === 'warn' ? 'text-warning' : ''
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
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-medium text-success">
            <Check size={16} />
            <span>Экспорт завершён</span>
          </div>
          <div>
            <span className="text-4xl font-semibold text-text-primary tabular-nums leading-none">
              {stream.progress.fetchedCount}
            </span>
            <div className="text-sm text-text-secondary mt-1">
              записей собрано
              {stream.progress.totalCount > 0 && (
                <span className="text-text-muted ml-1">из {stream.progress.totalCount}</span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="primary" onClick={handleDownload} icon={<Download size={16} />}>
              Скачать XLSX
            </Button>
            <Button variant="secondary" onClick={handleReset} icon={<RefreshCw size={16} />}>
              Новый экспорт
            </Button>
          </div>
        </div>
      )}

      {stream.status === 'error' && (
        <div className="space-y-4">
          <div className="flex items-start gap-2.5">
            <span className="text-sm shrink-0 mt-0.5 text-danger">✕</span>
            <div>
              <p className="text-sm font-medium text-danger">Не удалось выполнить экспорт</p>
              <p className="text-sm text-text-secondary mt-1">{stream.error}</p>
            </div>
          </div>
          <Button variant="secondary" onClick={handleReset} icon={<RefreshCw size={16} />}>
            Повторить
          </Button>
        </div>
      )}
    </PageShell>
  )
}
