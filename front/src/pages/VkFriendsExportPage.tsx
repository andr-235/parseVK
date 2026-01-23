import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PageHeroCard from '@/components/PageHeroCard'
import SectionCard from '@/components/SectionCard'
import { LoadingState } from '@/components/LoadingState'
import ProgressBar from '@/components/ProgressBar'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  vkFriendsExportService,
  type ExportJobStatus,
  type FriendFlatDto,
  type JobLogLevel,
  type VkFriendsJobLog,
  type VkFriendsNameCase,
  type VkFriendsOrder,
  type VkFriendsParams,
  type VkFriendsStreamEvent,
} from '@/services/vkFriendsExportService'

const PREVIEW_LIMIT = 100
const MAX_LOGS = 50

const selectClass =
  'h-10 rounded-lg border border-border/60 bg-background-secondary px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary'

const textareaClass =
  'min-h-28 w-full resize-y rounded-lg border border-border/60 bg-background-secondary px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary'

const ORDER_OPTIONS: Array<{ value: VkFriendsOrder; label: string }> = [
  { value: 'hints', label: 'hints' },
  { value: 'random', label: 'random' },
  { value: 'name', label: 'name' },
]

const NAME_CASE_OPTIONS: Array<{ value: VkFriendsNameCase; label: string }> = [
  { value: 'nom', label: 'nom' },
  { value: 'gen', label: 'gen' },
  { value: 'dat', label: 'dat' },
  { value: 'acc', label: 'acc' },
  { value: 'ins', label: 'ins' },
  { value: 'abl', label: 'abl' },
]

const PREVIEW_COLUMNS: Array<{ key: keyof FriendFlatDto; label: string }> = [
  { key: 'id', label: 'ID' },
  { key: 'first_name', label: 'Имя' },
  { key: 'last_name', label: 'Фамилия' },
  { key: 'nickname', label: 'Ник' },
  { key: 'domain', label: 'Домен' },
  { key: 'bdate', label: 'ДР' },
  { key: 'sex', label: 'Пол' },
  { key: 'status', label: 'Статус' },
  { key: 'online', label: 'Онлайн' },
  { key: 'last_seen_time', label: 'Последний визит' },
  { key: 'last_seen_platform', label: 'Платформа' },
  { key: 'city_title', label: 'Город' },
  { key: 'country_title', label: 'Страна' },
  { key: 'has_mobile', label: 'Моб.' },
  { key: 'can_post', label: 'Посты' },
  { key: 'can_see_all_posts', label: 'Видит посты' },
  { key: 'can_write_private_message', label: 'Можно писать' },
  { key: 'timezone', label: 'TZ' },
  { key: 'photo_50', label: 'Фото 50' },
  { key: 'photo_100', label: 'Фото 100' },
  { key: 'photo_200_orig', label: 'Фото 200' },
  { key: 'photo_id', label: 'Фото ID' },
  { key: 'relation', label: 'Отношения' },
  { key: 'contacts_mobile_phone', label: 'Тел. моб.' },
  { key: 'contacts_home_phone', label: 'Тел. дом.' },
  { key: 'education_university', label: 'Университет' },
  { key: 'education_faculty', label: 'Факультет' },
  { key: 'education_graduation', label: 'Год выпуска' },
  { key: 'universities', label: 'ВУЗы' },
  { key: 'raw_json', label: 'Raw JSON' },
]

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

const parseFields = (value: string): string[] | undefined => {
  const items = value
    .split(/[,\n]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

  return items.length > 0 ? items : undefined
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
  order: VkFriendsOrder | ''
  listId: string
  count: string
  offset: string
  nameCase: VkFriendsNameCase | ''
  ref: string
  fields: string
  includeRawJson: boolean
  exportXlsx: boolean
  exportDocx: boolean
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
    order: '',
    listId: '',
    count: '',
    offset: '',
    nameCase: '',
    ref: '',
    fields: '',
    includeRawJson: false,
    exportXlsx: true,
    exportDocx: false,
  })

  const [previewItems, setPreviewItems] = useState<FriendFlatDto[]>([])
  const [previewTotalCount, setPreviewTotalCount] = useState<number | null>(null)
  const [previewWarning, setPreviewWarning] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<ExportJobStatus | null>(null)
  const [jobWarning, setJobWarning] = useState<string | null>(null)
  const [jobError, setJobError] = useState<string | null>(null)
  const [jobProgress, setJobProgress] = useState({ fetchedCount: 0, totalCount: 0 })
  const [jobLogs, setJobLogs] = useState<JobLogEntry[]>([])
  const [hasXlsx, setHasXlsx] = useState(false)
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

    if (formState.order) {
      params.order = formState.order
    }

    const listId = toOptionalNumber(formState.listId)
    if (listId !== undefined) {
      params.list_id = listId
    }

    const count = toOptionalNumber(formState.count)
    if (count !== undefined) {
      params.count = count
    }

    const offset = toOptionalNumber(formState.offset)
    if (offset !== undefined) {
      params.offset = offset
    }

    const fields = parseFields(formState.fields)
    if (fields) {
      params.fields = fields
    }

    if (formState.nameCase) {
      params.name_case = formState.nameCase
    }

    const ref = formState.ref.trim()
    if (ref) {
      params.ref = ref
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
      setHasXlsx(Boolean(event.data.xlsxPath))
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
      setHasXlsx(Boolean(response.job.xlsxPath))
      setHasDocx(Boolean(response.job.docxPath))
      setJobLogs(normalizeLogs(response.logs))
    } catch {
      setJobError('Не удалось получить данные экспорта')
    }
  }

  const handlePreview = async () => {
    setPreviewError(null)
    setPreviewWarning(null)
    setIsPreviewLoading(true)

    try {
      const params = buildParams()
      const response = await vkFriendsExportService.preview({
        params,
        limit: PREVIEW_LIMIT,
        includeRawJson: formState.includeRawJson,
      })

      setPreviewItems(response.items)
      setPreviewTotalCount(response.totalCount)
      setPreviewWarning(response.warning ?? null)
    } catch {
      setPreviewError('Не удалось получить превью')
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const handleExport = async () => {
    setJobError(null)
    setJobWarning(null)
    setJobLogs([])
    setHasXlsx(false)
    setHasDocx(false)
    setJobProgress({ fetchedCount: 0, totalCount: 0 })
    setIsExportLoading(true)

    try {
      const params = buildParams()
      const response = await vkFriendsExportService.export({
        params,
        includeRawJson: formState.includeRawJson,
        exportXlsx: formState.exportXlsx,
        exportDocx: formState.exportDocx,
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

  const handleDownload = async (type: 'xlsx' | 'docx') => {
    if (!jobId) {
      return
    }

    try {
      await vkFriendsExportService.downloadJobFile(jobId, type)
    } catch {
      // errors are already surfaced via toast
    }
  }

  const previewRows = useMemo(() => previewItems.slice(0, PREVIEW_LIMIT), [previewItems])
  const totalCountLabel = useMemo(() => {
    if (previewTotalCount === null) {
      return '—'
    }
    return String(previewTotalCount)
  }, [previewTotalCount])

  const jobStatusLabel = jobStatus ? STATUS_LABELS[jobStatus] : '—'
  const jobStatusVariant = jobStatus ? STATUS_VARIANTS[jobStatus] : 'outline'
  const isJobDone = jobStatus === 'DONE'
  const canDownloadXlsx = isJobDone && hasXlsx
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
        description="Формируйте превью, запускайте экспорт и скачивайте отчёты по friends.get с прогрессом и логами."
        actions={
          <div className="flex flex-col gap-2 text-sm text-text-secondary">
            <span>Preview показывает до {PREVIEW_LIMIT} записей.</span>
            <span>Export сохраняет данные и формирует XLSX/DOCX.</span>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
        <SectionCard
          title="Параметры friends.get"
          description="Заполните параметры запроса и выберите опции экспорта."
        >
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
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

              <div className="space-y-2">
                <Label htmlFor="vk-order">order</Label>
                <select
                  id="vk-order"
                  value={formState.order}
                  onChange={(event) =>
                    updateField('order', event.target.value as FormState['order'])
                  }
                  className={selectClass}
                >
                  <option value="">Не задано</option>
                  {ORDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vk-list-id">list_id</Label>
                <Input
                  id="vk-list-id"
                  type="number"
                  value={formState.listId}
                  onChange={(event) => updateField('listId', event.target.value)}
                  placeholder="0"
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vk-count">count</Label>
                <Input
                  id="vk-count"
                  type="number"
                  value={formState.count}
                  onChange={(event) => updateField('count', event.target.value)}
                  placeholder="100"
                  min={0}
                  max={5000}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vk-offset">offset</Label>
                <Input
                  id="vk-offset"
                  type="number"
                  value={formState.offset}
                  onChange={(event) => updateField('offset', event.target.value)}
                  placeholder="0"
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vk-name-case">name_case</Label>
                <select
                  id="vk-name-case"
                  value={formState.nameCase}
                  onChange={(event) =>
                    updateField('nameCase', event.target.value as FormState['nameCase'])
                  }
                  className={selectClass}
                >
                  <option value="">Не задано</option>
                  {NAME_CASE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="vk-ref">ref</Label>
                <Input
                  id="vk-ref"
                  value={formState.ref}
                  onChange={(event) => updateField('ref', event.target.value)}
                  placeholder="ref"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="vk-fields">fields</Label>
                <textarea
                  id="vk-fields"
                  value={formState.fields}
                  onChange={(event) => updateField('fields', event.target.value)}
                  placeholder="photo_100, city, country"
                  className={textareaClass}
                />
                <p className="text-xs text-text-secondary">Через запятую или новую строку</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
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

              <label
                htmlFor="vk-export-xlsx"
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/50 bg-background-secondary/70 px-3 py-2 text-sm"
              >
                <input
                  id="vk-export-xlsx"
                  type="checkbox"
                  checked={formState.exportXlsx}
                  onChange={(event) => updateField('exportXlsx', event.target.checked)}
                  className="h-5 w-5 rounded border-border bg-background text-accent-primary focus:ring-accent-primary focus:ring-offset-0"
                />
                exportXlsx
              </label>

              <label
                htmlFor="vk-export-docx"
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/50 bg-background-secondary/70 px-3 py-2 text-sm"
              >
                <input
                  id="vk-export-docx"
                  type="checkbox"
                  checked={formState.exportDocx}
                  onChange={(event) => updateField('exportDocx', event.target.checked)}
                  className="h-5 w-5 rounded border-border bg-background text-accent-primary focus:ring-accent-primary focus:ring-offset-0"
                />
                exportDocx
              </label>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Button onClick={handlePreview} disabled={isPreviewLoading} variant="secondary">
                {isPreviewLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="size-4" />
                    Preview...
                  </span>
                ) : (
                  'Preview'
                )}
              </Button>

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

              {previewError && <span className="text-sm text-destructive">{previewError}</span>}
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
                  onClick={() => handleDownload('xlsx')}
                  disabled={!canDownloadXlsx}
                >
                  Download XLSX
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload('docx')}
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

      <SectionCard title="Preview" description={`Первые ${PREVIEW_LIMIT} записей из friends.get.`}>
        {isPreviewLoading ? (
          <LoadingState message="Загрузка preview..." />
        ) : previewRows.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Превью пока нет</EmptyTitle>
              <EmptyDescription>
                Заполните параметры и нажмите Preview, чтобы увидеть первые записи.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
              <span>Всего: {totalCountLabel}</span>
              <span>Показано: {previewRows.length}</span>
              {previewWarning && <Badge variant="highlight">{previewWarning}</Badge>}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  {PREVIEW_COLUMNS.map((column) => (
                    <TableHead key={column.key} className="whitespace-nowrap">
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, rowIndex) => (
                  <TableRow key={`${row.id ?? 'row'}-${rowIndex}`}>
                    {PREVIEW_COLUMNS.map((column) => {
                      const rawValue = row[column.key]
                      const formatted = formatCellValue(rawValue)
                      const truncated = truncateValue(formatted)
                      const showTitle = formatted !== truncated

                      return (
                        <TableCell key={`${column.key}-${rowIndex}`} className="max-w-[220px]">
                          <span
                            title={showTitle ? formatted : undefined}
                            className="block truncate"
                          >
                            {truncated}
                          </span>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

export default VkFriendsExportPage
