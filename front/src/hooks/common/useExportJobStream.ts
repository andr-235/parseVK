import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ExportJobStatus, JobLogLevel } from '@/types/common'
import type { ExportStreamEvent } from '@/api/common/sse'
import { STATUS_LABELS, STATUS_VARIANTS } from '@/utils/common/exportUtils'

const MAX_LOGS = 50

export type JobLogEntry = {
  id: string
  level: JobLogLevel
  message: string
  meta?: unknown
  createdAt?: string
}

export interface ExportServiceAdapter<TParams> {
  export: (payload: { params: TParams }) => Promise<{ jobId: string; status: ExportJobStatus }>
  getJob: (jobId: string) => Promise<{
    job: {
      status: ExportJobStatus
      totalCount?: number | null
      fetchedCount: number
      warning?: string | null
      error?: string | null
      xlsxPath?: string | null
    }
    logs: Array<{
      id: string
      level: JobLogLevel
      message: string
      meta?: unknown
      createdAt: string
    }>
  }>
  streamJob: (
    jobId: string,
    handlers: {
      onEvent: (event: ExportStreamEvent) => void
      onError?: (error: Error) => void
    }
  ) => { close: () => void }
  downloadJobFile: (jobId: string, type: 'xlsx') => Promise<void>
}

export interface UseExportJobStreamProps<TParams> {
  service: ExportServiceAdapter<TParams>
  buildParams: () => TParams
  exportErrorMessage?: string
  fetchErrorMessage?: string
}

const createLogId = (): string => {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const useExportJobStream = <TParams>({
  service,
  buildParams,
  exportErrorMessage = 'Не удалось запустить экспорт',
  fetchErrorMessage = 'Не удалось получить данные экспорта',
}: UseExportJobStreamProps<TParams>) => {
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<ExportJobStatus | null>(null)
  const [jobWarning, setJobWarning] = useState<string | null>(null)
  const [jobError, setJobError] = useState<string | null>(null)
  const [jobProgress, setJobProgress] = useState({ fetchedCount: 0, totalCount: 0 })
  const [jobLogs, setJobLogs] = useState<JobLogEntry[]>([])
  const [hasXlsx, setHasXlsx] = useState(false)
  const [isExportLoading, setIsExportLoading] = useState(false)

  const streamCloseRef = useRef<null | (() => void)>(null)

  const closeStream = useCallback(() => {
    if (streamCloseRef.current) {
      streamCloseRef.current()
      streamCloseRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      closeStream()
    }
  }, [closeStream])

  const appendJobLog = useCallback((entry: JobLogEntry) => {
    setJobLogs((prev) => {
      const next = [...prev, entry]
      if (next.length > MAX_LOGS) {
        return next.slice(-MAX_LOGS)
      }
      return next
    })
  }, [])

  const resetJobState = useCallback(() => {
    setJobError(null)
    setJobWarning(null)
    setJobLogs([])
    setHasXlsx(false)
    setJobProgress({ fetchedCount: 0, totalCount: 0 })
  }, [])

  const handleStreamEvent = useCallback(
    (event: ExportStreamEvent) => {
      if (event.type === 'progress') {
        setJobStatus('RUNNING')
        setJobProgress({
          fetchedCount: event.data.fetchedCount,
          totalCount: event.data.totalCount,
        })
        return
      }

      if (event.type === 'log') {
        appendJobLog({
          id: createLogId(),
          level: event.data.level,
          message: event.data.message,
          meta: event.data.meta,
          createdAt: new Date().toISOString(),
        })
        return
      }

      if (event.type === 'done') {
        setJobStatus('DONE')
        setJobWarning(event.data.warning ?? null)
        setJobProgress((prev) => ({
          fetchedCount: event.data.fetchedCount,
          totalCount: event.data.totalCount ?? prev.totalCount,
        }))
        setHasXlsx(Boolean(event.data.xlsxPath))
        closeStream()

        if (event.data.xlsxPath && event.data.jobId) {
          void service.downloadJobFile(event.data.jobId, 'xlsx').catch(() => {})
        }
        return
      }

      if (event.type === 'error') {
        setJobStatus('FAILED')
        setJobError(event.data.message)
        closeStream()
      }
    },
    [appendJobLog, closeStream, service]
  )

  const connectStream = useCallback(
    (id: string) => {
      closeStream()
      const { close } = service.streamJob(id, {
        onEvent: handleStreamEvent,
        onError: (error) => {
          setJobStatus('FAILED')
          setJobError(error.message)
        },
      })

      streamCloseRef.current = close
    },
    [closeStream, handleStreamEvent, service]
  )

  const normalizeLogs = useCallback(
    (
      logs: Array<{
        id: string
        level: JobLogLevel
        message: string
        meta?: unknown
        createdAt: string
      }>
    ): JobLogEntry[] => {
      const sorted = [...logs].sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime()
        const timeB = new Date(b.createdAt).getTime()
        return timeA - timeB
      })

      return sorted.slice(-MAX_LOGS).map((log) => ({
        id: log.id,
        level: log.level,
        message: log.message,
        meta: log.meta,
        createdAt: log.createdAt,
      }))
    },
    []
  )

  const loadJob = useCallback(
    async (id: string) => {
      try {
        const response = await service.getJob(id)
        setJobStatus(response.job.status)
        setJobWarning(response.job.warning ?? null)
        setJobError(response.job.error ?? null)
        setJobProgress({
          fetchedCount: response.job.fetchedCount ?? 0,
          totalCount: response.job.totalCount ?? 0,
        })
        setHasXlsx(Boolean(response.job.xlsxPath))
        setJobLogs(normalizeLogs(response.logs))
      } catch {
        setJobError(fetchErrorMessage)
      }
    },
    [service, normalizeLogs, fetchErrorMessage]
  )

  const handleExport = useCallback(async () => {
    resetJobState()
    setIsExportLoading(true)

    try {
      const params = buildParams()
      const response = await service.export({
        params,
      })

      setJobId(response.jobId)
      setJobStatus(response.status)
      await loadJob(response.jobId)
      connectStream(response.jobId)
    } catch {
      setJobStatus('FAILED')
      setJobError(exportErrorMessage)
    } finally {
      setIsExportLoading(false)
    }
  }, [buildParams, connectStream, loadJob, resetJobState, service, exportErrorMessage])

  const handleDownloadXlsx = useCallback(async () => {
    if (!jobId) return
    try {
      await service.downloadJobFile(jobId, 'xlsx')
    } catch {
      // Ошибки показываются в toast сервиса
    }
  }, [jobId, service])

  const { jobStatusLabel, jobStatusVariant, progressLabel, isProgressIndeterminate } = useMemo(
    () => ({
      jobStatusLabel: jobStatus ? STATUS_LABELS[jobStatus] : '—',
      jobStatusVariant: jobStatus ? STATUS_VARIANTS[jobStatus] : 'outline',
      progressLabel:
        jobProgress.totalCount > 0
          ? `Обработано ${jobProgress.fetchedCount} из ${jobProgress.totalCount}`
          : `Обработано ${jobProgress.fetchedCount}`,
      isProgressIndeterminate: jobStatus === 'RUNNING' && jobProgress.totalCount === 0,
    }),
    [jobProgress.fetchedCount, jobProgress.totalCount, jobStatus]
  )

  const handleGenerateXlsx = useCallback(async () => {
    await handleExport()
  }, [handleExport])

  return {
    jobWarning,
    jobError,
    jobLogs,
    jobProgress,
    jobStatusLabel,
    jobStatusVariant,
    progressLabel,
    isProgressIndeterminate,
    isExportLoading,
    handleGenerateXlsx,
    handleDownloadXlsx,
    hasXlsx,
    jobStatus,
    jobId,
  }
}
