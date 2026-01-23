import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  vkFriendsExportService,
  type ExportJobStatus,
  type JobLogLevel,
  type VkFriendsJobLog,
  type VkFriendsParams,
  type VkFriendsStreamEvent,
} from '@/services/vkFriendsExportService'
import { STATUS_LABELS, STATUS_VARIANTS, toOptionalNumber } from '../utils/vkFriendsExportUtils'

const MAX_LOGS = 50

type FormState = {
  userId: string
  includeRawJson: boolean
}

export type JobLogEntry = {
  id: string
  level: JobLogLevel
  message: string
  meta?: unknown
  createdAt?: string
}

const normalizeLogs = (logs: VkFriendsJobLog[]): JobLogEntry[] => {
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
}

const createLogId = (): string => {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const useVkFriendsExport = () => {
  const [formState, setFormState] = useState<FormState>({
    userId: '',
    includeRawJson: false,
  })

  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<ExportJobStatus | null>(null)
  const [jobWarning, setJobWarning] = useState<string | null>(null)
  const [jobError, setJobError] = useState<string | null>(null)
  const [jobProgress, setJobProgress] = useState({ fetchedCount: 0, totalCount: 0 })
  const [jobLogs, setJobLogs] = useState<JobLogEntry[]>([])
  const [hasDocx, setHasDocx] = useState(false)
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

  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const buildParams = useCallback((): VkFriendsParams => {
    const params: VkFriendsParams = {}

    const userId = toOptionalNumber(formState.userId)
    if (userId !== undefined) {
      params.user_id = userId
    }

    return params
  }, [formState.userId])

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
    setHasDocx(false)
    setJobProgress({ fetchedCount: 0, totalCount: 0 })
  }, [])

  const handleStreamEvent = useCallback(
    (event: VkFriendsStreamEvent) => {
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
        setHasDocx(Boolean(event.data.docxPath))
        closeStream()
        return
      }

      if (event.type === 'error') {
        setJobStatus('FAILED')
        setJobError(event.data.message)
        closeStream()
      }
    },
    [appendJobLog, closeStream]
  )

  const connectStream = useCallback(
    (id: string) => {
      closeStream()
      const { close } = vkFriendsExportService.streamJob(id, {
        onEvent: handleStreamEvent,
        onError: (error) => {
          setJobStatus('FAILED')
          setJobError(error.message)
        },
      })

      streamCloseRef.current = close
    },
    [closeStream, handleStreamEvent]
  )

  const loadJob = useCallback(async (id: string) => {
    try {
      const response = await vkFriendsExportService.getJob(id)
      setJobStatus(response.job.status)
      setJobWarning(response.job.warning ?? null)
      setJobError(response.job.error ?? null)
      setJobProgress({
        fetchedCount: response.job.fetchedCount ?? 0,
        totalCount: response.job.totalCount ?? 0,
      })
      setHasDocx(Boolean(response.job.docxPath))
      setJobLogs(normalizeLogs(response.logs))
    } catch {
      setJobError('Не удалось получить данные экспорта')
    }
  }, [])

  const handleExport = useCallback(async () => {
    resetJobState()
    setIsExportLoading(true)

    try {
      const params = buildParams()
      const response = await vkFriendsExportService.export({
        params,
        includeRawJson: formState.includeRawJson,
      })

      setJobId(response.jobId)
      setJobStatus(response.status)
      await loadJob(response.jobId)
      connectStream(response.jobId)
    } catch {
      setJobStatus('FAILED')
      setJobError('Не удалось запустить экспорт')
    } finally {
      setIsExportLoading(false)
    }
  }, [buildParams, connectStream, formState.includeRawJson, loadJob, resetJobState])

  const handleDownloadDocx = useCallback(async () => {
    if (!jobId) {
      return
    }

    try {
      await vkFriendsExportService.downloadJobFile(jobId, 'docx')
    } catch {
      // errors are already surfaced via toast
    }
  }, [jobId])

  const { jobStatusLabel, jobStatusVariant, isJobDone, progressLabel, isProgressIndeterminate } =
    useMemo(
      () => ({
        jobStatusLabel: jobStatus ? STATUS_LABELS[jobStatus] : '—',
        jobStatusVariant: jobStatus ? STATUS_VARIANTS[jobStatus] : 'outline',
        isJobDone: jobStatus === 'DONE',
        progressLabel:
          jobProgress.totalCount > 0
            ? `Обработано ${jobProgress.fetchedCount} из ${jobProgress.totalCount}`
            : `Обработано ${jobProgress.fetchedCount}`,
        isProgressIndeterminate: jobStatus === 'RUNNING' && jobProgress.totalCount === 0,
      }),
      [jobProgress.fetchedCount, jobProgress.totalCount, jobStatus]
    )

  return {
    formState,
    updateField,
    jobWarning,
    jobError,
    jobLogs,
    jobProgress,
    jobStatusLabel,
    jobStatusVariant,
    progressLabel,
    isProgressIndeterminate,
    canDownloadDocx: isJobDone && hasDocx,
    isExportLoading,
    handleExport,
    handleDownloadDocx,
  }
}
