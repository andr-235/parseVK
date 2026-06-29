import { useState, useCallback, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FeedbackToast } from '../../components/ui'
import { PageShell } from '../../components/layout/PageShell'
import { useFeedback } from '../../shared/hooks/useFeedback'
import { useFriendsExportStream } from '../../shared/hooks/useFriendsExportStream'
import { startOkFriendsExport, downloadOkFriendsXlsx, getOkFriendsStreamUrl, type StartOkFriendsExportParams } from '../../shared/api/ok-friends'
import { ExportWorkspace } from '../friends-export/components/ExportWorkspace'
import { OkExportForm } from './components/OkExportForm'

export function OkFriendsExportPage() {
  const [jobId, setJobId] = useState<string | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  const { feedback, showFeedback, dismissFeedback } = useFeedback()

  const stream = useFriendsExportStream(jobId, getOkFriendsStreamUrl)

  const exportMutation = useMutation({
    mutationFn: startOkFriendsExport,
    onSuccess: (data) => {
      setJobId(data.jobId)
    },
    onError: (err) => {
      showFeedback('error', err instanceof Error ? err.message : 'Ошибка запуска экспорта')
    },
  })

  const handleExport = useCallback((params: StartOkFriendsExportParams) => {
    exportMutation.mutate(params)
  }, [exportMutation])

  const handleDownload = useCallback(async () => {
    if (!jobId && !stream.xlsxPath) return
    const downloadJobId = jobId ?? ''
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
      showFeedback('error', err instanceof Error ? err.message : 'Ошибка скачивания')
    }
  }, [jobId, stream.xlsxPath, showFeedback])

  const handleReset = useCallback(() => {
    setJobId(null)
    stream.reset()
  }, [stream])

  useEffect(() => {
    if (stream.status === 'done') {
      showFeedback('success', 'Экспорт завершён')
    } else if (stream.status === 'error') {
      showFeedback('error', stream.error || 'Ошибка экспорта')
    }
  }, [stream.status, stream.error, showFeedback])

  useEffect(() => {
    if (typeof logEndRef.current?.scrollIntoView === 'function') {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [stream.logs])

  return (
    <PageShell title="Экспорт друзей OK">
      <FeedbackToast feedback={feedback} onDismiss={dismissFeedback} />

      <ExportWorkspace
        description="Выгрузка списка друзей пользователя OK в XLSX."
        form={(
          <OkExportForm
            onSubmit={handleExport}
            disabled={stream.status === 'running' || stream.status === 'connecting'}
            isLoading={exportMutation.isPending}
          />
        )}
        stream={stream}
        logEndRef={logEndRef}
        onDownload={handleDownload}
        onReset={handleReset}
      />
    </PageShell>
  )
}
