import { useCallback, useEffect, useRef, useState } from 'react'
import PageHeroCard from '@/components/PageHeroCard'
import SectionCard from '@/components/SectionCard'
import ProgressBar from '@/components/ProgressBar'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import {
  vkFriendsExportService,
  type ExportJobStatus,
  type JobLogLevel,
  type VkFriendsJobLog,
  type VkFriendsParams,
  type VkFriendsStreamEvent,
} from '@/services/vkFriendsExportService'

const MAX_LOGS = 50

const STATUS_LABELS: Record<ExportJobStatus, string> = {
  PENDING: 'В ожидании',
  RUNNING: 'В работе',
  DONE: 'Готово',
  FAILED: 'Ошибка',
}

const STATUS_VARIANTS: Record<ExportJobStatus, BadgeProps['variant']> = {
  PENDING: 'outline',
  RUNNING: 'secondary',
  DONE: 'default',
  FAILED: 'destructive',
}

const LOG_LEVEL_LABELS: Record<JobLogLevel, string> = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
}

const LOG_LEVEL_CLASSES: Record<JobLogLevel, string> = {
  info: 'text-text-secondary',
  warn: 'text-accent-warning',
  error: 'text-destructive',
}

const toOptionalNumber = (value: string): number | undefined => {
  const normalized = value.trim()
  if (!normalized) {
    return undefined
  }

  const numeric = Number(normalized)
  if (!Number.isFinite(numeric)) {
    return undefined
  }

  return Math.trunc(numeric)
}

const formatCellValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  if (typeof value === 'boolean') {
    return value ? 'Да' : 'Нет'
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return '—'
    }
  }

  return String(value)
}

const truncateValue = (value: string, limit = 120): string => {
  if (value.length <= limit) {
    return value
  }

  return `${value.slice(0, limit - 3)}...`
}

const formatLogTime = (value?: string): string => {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

type FormState = {
  userId: string
  includeRawJson: boolean
}

type JobLogEntry = {
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

function VkFriendsExportPage() {
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

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const buildParams = (): VkFriendsParams => {
    const params: VkFriendsParams = {}

    const userId = toOptionalNumber(formState.userId)
    if (userId !== undefined) {
      params.user_id = userId
    }

    return params
  }

  const appendJobLog = (entry: JobLogEntry) => {
    setJobLogs((prev) => {
      const next = [...prev, entry]
      if (next.length > MAX_LOGS) {
        return next.slice(-MAX_LOGS)
      }
      return next
    })
  }

  const handleStreamEvent = (event: VkFriendsStreamEvent) => {
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
  }

  const connectStream = (id: string) => {
    closeStream()
    const { close } = vkFriendsExportService.streamJob(id, {
      onEvent: handleStreamEvent,
      onError: (error) => {
        setJobStatus('FAILED')
        setJobError(error.message)
      },
    })

    streamCloseRef.current = close
  }

  const loadJob = async (id: string) => {
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
  }

  const handleExport = async () => {
    setJobError(null)
    setJobWarning(null)
    setJobLogs([])
    setHasDocx(false)
    setJobProgress({ fetchedCount: 0, totalCount: 0 })
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
  }

  const handleDownloadDocx = async () => {
    if (!jobId) {
      return
    }

    try {
      await vkFriendsExportService.downloadJobFile(jobId, 'docx')
    } catch {
      // errors are already surfaced via toast
    }
  }

  const jobStatusLabel = jobStatus ? STATUS_LABELS[jobStatus] : '—'
  const jobStatusVariant = jobStatus ? STATUS_VARIANTS[jobStatus] : 'outline'
  const isJobDone = jobStatus === 'DONE'
  const canDownloadDocx = isJobDone && hasDocx
  const progressLabel =
    jobProgress.totalCount > 0
      ? `Обработано ${jobProgress.fetchedCount} из ${jobProgress.totalCount}`
      : `Обработано ${jobProgress.fetchedCount}`
  const isProgressIndeterminate = jobStatus === 'RUNNING' && jobProgress.totalCount === 0

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeroCard
        title="Экспорт друзей ВКонтакте"
        description="Запускайте экспорт friends.get и скачивайте DOCX с прогрессом и логами."
        actions={
          <div className="flex flex-col gap-2 text-sm text-text-secondary">
            <span>Export сохраняет данные и формирует DOCX.</span>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
        <SectionCard
          title="Параметры friends.get"
          description="Введите user_id. count и fields задаются автоматически как “все”."
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="vk-user-id">user_id</Label>
              <Input
                id="vk-user-id"
                type="number"
                value={formState.userId}
                onChange={(event) => updateField('userId', event.target.value)}
                placeholder="123456"
                min={0}
              />
            </div>

            <div className="grid gap-3">
              <label
                htmlFor="vk-include-raw"
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/50 bg-background-secondary/70 px-3 py-2 text-sm"
              >
                <input
                  id="vk-include-raw"
                  type="checkbox"
                  checked={formState.includeRawJson}
                  onChange={(event) => updateField('includeRawJson', event.target.checked)}
                  className="h-5 w-5 rounded border-border bg-background text-accent-primary focus:ring-accent-primary focus:ring-offset-0"
                />
                includeRawJson
              </label>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Button onClick={handleExport} disabled={isExportLoading}>
                {isExportLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="size-4" />
                    Run export...
                  </span>
                ) : (
                  'Run export'
                )}
              </Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Прогресс и логи" description="Состояние текущего экспорта и события.">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">Статус:</span>
                <Badge variant={jobStatusVariant}>{jobStatusLabel}</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadDocx}
                  disabled={!canDownloadDocx}
                >
                  Download DOCX
                </Button>
              </div>
            </div>

            <ProgressBar
              current={jobProgress.fetchedCount}
              total={jobProgress.totalCount}
              label={progressLabel}
              indeterminate={isProgressIndeterminate}
            />

            {jobWarning && (
              <div className="rounded-lg border border-border/60 bg-background-secondary/80 px-3 py-2 text-sm text-text-secondary">
                <span className="font-medium text-accent-warning">Внимание:</span> {jobWarning}
              </div>
            )}

            {jobError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {jobError}
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium text-text-secondary">Последние логи</div>
              {jobLogs.length === 0 ? (
                <div className="rounded-lg border border-border/50 bg-background-secondary/70 px-4 py-6 text-center text-sm text-text-secondary">
                  Логи появятся после запуска экспорта.
                </div>
              ) : (
                <div className="max-h-72 space-y-3 overflow-auto rounded-lg border border-border/60 bg-background-secondary/70 p-4">
                  {jobLogs.map((log) => (
                    <div key={log.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${LOG_LEVEL_CLASSES[log.level]}`}>
                            {LOG_LEVEL_LABELS[log.level]}
                          </span>
                          <span className="text-sm text-text-primary">{log.message}</span>
                        </div>
                        {log.createdAt && (
                          <span className="text-xs text-text-tertiary">
                            {formatLogTime(log.createdAt)}
                          </span>
                        )}
                      </div>
                      {log.meta !== undefined && (
                        <div className="text-xs text-text-tertiary">
                          {truncateValue(formatCellValue(log.meta), 140)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

export default VkFriendsExportPage
