import { useState, useCallback, useRef, useEffect, type ComponentType } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FeedbackToast } from '../../components/ui'
import { PageShell } from '../../components/layout/PageShell'
import { useFeedback } from '../../shared/hooks/useFeedback'
import { useFriendsExportStream } from '../../shared/hooks/useFriendsExportStream'
import type { FriendsExportStartResponse } from '../../shared/api/friends-export-types'
import { ExportWorkspace } from './components/ExportWorkspace'
import { formatError } from '../../shared/utils/error'

export type PlatformExportConfig<TParams> = {
  title: string
  description: string
  FormComponent: ComponentType<{
    onSubmit: (params: TParams) => void
    disabled: boolean
    isLoading: boolean
  }>
  startExport: (params: TParams) => Promise<FriendsExportStartResponse>
  downloadXlsx: (jobId: string) => Promise<Blob>
  getStreamUrl: (jobId: string) => string
  platform: 'vk' | 'ok'
  downloadFileName: string
}

type FriendsExportPageProps<TParams> = {
  config: PlatformExportConfig<TParams>
}

export function FriendsExportPage<TParams>({ config }: FriendsExportPageProps<TParams>) {
  const [jobId, setJobId] = useState<string | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  const { feedback, showFeedback, dismissFeedback } = useFeedback()

  const stream = useFriendsExportStream(jobId, config.getStreamUrl)

  const exportMutation = useMutation({
    mutationFn: config.startExport,
    onSuccess: (data) => {
      console.log(`[FriendsExportPage] ${config.platform} export started:`, data.jobId)
      setJobId(data.jobId)
    },
    onError: (err) => {
      console.error(`[FriendsExportPage] ${config.platform} export start failed:`, err)
      showFeedback('error', formatError(err))
    },
  })

  const handleExport = useCallback((params: TParams) => {
    exportMutation.mutate(params)
  }, [exportMutation])

  const handleDownload = useCallback(async () => {
    if (!jobId && !stream.xlsxPath) return
    const downloadJobId = jobId ?? ''
    try {
      const blob = await config.downloadXlsx(downloadJobId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${config.downloadFileName}_${downloadJobId}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      showFeedback('success', 'Файл скачан')
    } catch (err) {
      console.error(`[FriendsExportPage] ${config.platform} download failed:`, err)
      showFeedback('error', formatError(err))
    }
  }, [jobId, stream.xlsxPath, showFeedback, config])

  const handleReset = useCallback(() => {
    console.log(`[FriendsExportPage] ${config.platform} export reset`)
    setJobId(null)
    stream.reset()
  }, [stream, config.platform])

  const handleRetry = useCallback(() => {
    console.log(`[FriendsExportPage] ${config.platform} export retry`)
    dismissFeedback()
    setJobId(null)
    stream.reset()
  }, [stream, config.platform, dismissFeedback])

  useEffect(() => {
    if (stream.status === 'done') {
      console.log(`[FriendsExportPage] ${config.platform} export completed`)
      showFeedback('success', 'Экспорт завершён')
    } else if (stream.status === 'error') {
      console.error(`[FriendsExportPage] ${config.platform} export error:`, stream.error)
      showFeedback('error', stream.error || 'Ошибка экспорта')
    }
  }, [stream.status, stream.error, showFeedback, config.platform])

  const isStreamActive = stream.status === 'running' || stream.status === 'connecting'

  useEffect(() => {
    if (typeof logEndRef.current?.scrollIntoView === 'function') {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [stream.logs])

  return (
    <PageShell title={config.title}>
      <FeedbackToast feedback={feedback} onDismiss={dismissFeedback} />

      <ExportWorkspace
        description={config.description}
        form={(
          <config.FormComponent
            onSubmit={handleExport}
            disabled={isStreamActive}
            isLoading={exportMutation.isPending}
          />
        )}
        stream={stream}
        logEndRef={logEndRef}
        onDownload={handleDownload}
        onReset={handleReset}
        onRetry={handleRetry}
      />
    </PageShell>
  )
}
