import { useState, useCallback, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Download, RefreshCw, Check, FileSpreadsheet } from 'lucide-react'
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

      <div className="mb-6">
        <p className="mb-3 text-sm text-text-secondary">
          Выгрузите список друзей пользователя ВКонтакте в формате XLSX.
        </p>

        <VkExportForm
          onSubmit={handleExport}
          disabled={stream.status === 'running' || stream.status === 'connecting'}
          isLoading={exportMutation.isPending}
        />
      </div>

      {(stream.status === 'connecting' || stream.status === 'running') && (
        <div className="mb-6 space-y-3 rounded-lg border border-border bg-bg-panel p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <Spinner size={16} />
            <span>Экспорт выполняется...</span>
          </div>

          {stream.progress.totalCount > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Прогресс</span>
                <span>{stream.progress.fetchedCount} / {stream.progress.totalCount}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-bg-main">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {stream.logs.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded border border-border bg-bg-main p-2 font-mono text-xs">
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
          )}
        </div>
      )}

      {stream.status === 'done' && (
        <div className="mb-6 space-y-3 rounded-lg border border-border bg-bg-panel p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-success">
            <Check size={16} />
            <span>Экспорт завершён</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
            <FileSpreadsheet size={16} />
            <span>Собрано: {stream.progress.fetchedCount}</span>
            {stream.progress.totalCount > 0 && (
              <span>(всего: {stream.progress.totalCount})</span>
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
        <div className="mb-6 space-y-3 rounded-lg border border-border bg-bg-panel p-4">
          <p className="text-sm text-danger">{stream.error}</p>
          <Button variant="secondary" size="sm" onClick={handleReset} icon={<RefreshCw size={14} />}>
            Повторить
          </Button>
        </div>
      )}
    </PageShell>
  )
}
