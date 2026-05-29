import { useEffect, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Download,
  Play,
  Table2,
  ChevronLeft,
  ChevronRight,
  Upload,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { PageHeader } from '@/shared/components/common'
import SectionCard from '@/shared/components/common/SectionCard'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { LoadingState } from '@/shared/components/common/LoadingState'
import FileUpload from '@/shared/components/common/FileUpload'

import { useTelegramDlUpload } from '@/pages/telegram-dl-upload/hooks/useTelegramDlUpload'
import { telegramDlUploadQueryKeys } from '@/pages/telegram-dl-upload/api/queryKeys'
import {
  telegramDlUploadService,
  type TelegramDlImportFile,
  type TelegramDlImportContact,
  type TelegramDlMatchResult,
  type TelegramDlMatchRun,
} from '@/pages/telegram-dl-upload/api/telegramDlUpload.api'
import type { UseTelegramDlUploadResult } from '@/pages/telegram-dl-upload/hooks/useTelegramDlUpload.types'

const XLSX_ACCEPT = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

type TelegramDlTabId = 'import' | 'match'

const tabs: Array<{ id: TelegramDlTabId; label: string; description: string }> = [
  {
    id: 'import',
    label: 'Импорт DL',
    description: 'Загрузка XLSX и история файлов',
  },
  {
    id: 'match',
    label: 'Матчинг DL',
    description: 'Полная база и последний запуск матчинга',
  },
]

type MatchFilter = 'all' | 'strict' | 'username' | 'phone' | 'chat'

const filterLabels: Record<MatchFilter, string> = {
  all: 'Все',
  strict: 'ID',
  username: 'Username',
  phone: 'Phone',
  chat: 'Chat',
}

const applyExcludedChats = (
  results: TelegramDlMatchResult[],
  excludedPeerIds: string[]
): TelegramDlMatchResult[] => {
  if (excludedPeerIds.length === 0) {
    return results
  }

  const excludedSet = new Set(excludedPeerIds)

  return results.reduce<TelegramDlMatchResult[]>((next, item) => {
    const remainingChats =
      item.user?.relatedChats?.filter((chat) => !excludedSet.has(chat.peer_id)) ?? []
    const nextChatActivityMatch = item.chatActivityMatch && remainingChats.length > 0

    if (
      !item.strictTelegramIdMatch &&
      !item.usernameMatch &&
      !item.phoneMatch &&
      !nextChatActivityMatch
    ) {
      return next
    }

    next.push({
      ...item,
      chatActivityMatch: nextChatActivityMatch,
      user: item.user
        ? {
            ...item.user,
            relatedChats: remainingChats,
          }
        : null,
    })

    return next
  }, [])
}

interface TelegramDlTabsProps {
  activeTab: TelegramDlTabId
  onChange: (tab: TelegramDlTabId) => void
}

function TelegramDlTabs({ activeTab, onChange }: TelegramDlTabsProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-2 shadow-soft-md backdrop-blur-2xl">
      <div
        role="tablist"
        aria-label="Режимы работы с выгрузкой DL"
        className="grid gap-2 md:grid-cols-2"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={[
                'rounded-xl border px-4 py-3 text-left transition-colors',
                isActive
                  ? 'border-primary/40 bg-primary/12 text-white shadow-lg shadow-primary/10'
                  : 'border-transparent bg-white/[0.03] text-slate-300 hover:border-white/10 hover:bg-white/[0.05] hover:text-white',
              ].join(' ')}
            >
              <div className="text-sm font-semibold">{tab.label}</div>
              <div className="mt-1 text-xs text-slate-400">{tab.description}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface TelegramDlUploadCardProps {
  isUploading: boolean
  uploadStatuses: TelegramDlImportFile[]
  onSubmit: (files: File[]) => Promise<unknown>
}

function TelegramDlUploadCard({
  isUploading,
  uploadStatuses,
  onSubmit,
}: TelegramDlUploadCardProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleFilesSelect = async (files: File[]) => {
    setSelectedFiles(files)
  }

  const handleLegacyUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length > 0) {
      setSelectedFiles(files)
    }
  }

  const handleClear = () => {
    setSelectedFiles([])
  }

  const handleSubmit = async () => {
    if (selectedFiles.length === 0 || isUploading) {
      return
    }

    await onSubmit(selectedFiles)
    setSelectedFiles([])
  }

  return (
    <SectionCard
      title="Загрузка файлов"
      description="Выберите один или несколько XLSX файлов и проверьте список перед отправкой."
      className="relative border border-white/10 bg-[#131316]/90 backdrop-blur-2xl"
      headerClassName="border-white/10"
      contentClassName="space-y-6"
    >
      <div className="space-y-4">
        <FileUpload
          accept={XLSX_ACCEPT}
          multiple
          autoReset={false}
          variant="dropzone"
          dropzoneText="Перетащите XLSX сюда или нажмите, чтобы выбрать несколько файлов"
          buttonText="Выбрать XLSX"
          buttonVariant="outline"
          className="w-full"
          onFilesSelect={handleFilesSelect}
          onUpload={handleLegacyUpload}
        />

        <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
          <span>Выбрано файлов: {selectedFiles.length}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={selectedFiles.length === 0}
            className="h-8 text-slate-300 hover:text-white"
          >
            Очистить
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Upload className="size-4" />
          Файлы в очереди
        </div>

        {selectedFiles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-slate-800/30 px-4 py-6 text-sm text-slate-400">
            Пока файлы не выбраны.
          </div>
        ) : (
          <div className="space-y-2">
            {selectedFiles.map((file) => (
              <div
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-slate-800/30 px-4 py-3 text-sm"
              >
                <span className="truncate text-white">{file.name}</span>
                <span className="shrink-0 text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          className="w-full h-11 bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/25"
          disabled={selectedFiles.length === 0 || isUploading}
          onClick={() => void handleSubmit()}
        >
          {isUploading ? 'Загрузка...' : 'Загрузить в tgmbase'}
        </Button>

        {uploadStatuses.length > 0 ? (
          <div className="space-y-2">
            {uploadStatuses.map((file) => (
              <div
                key={file.id}
                className="rounded-lg border border-white/10 bg-slate-800/30 px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-white">{file.originalFileName}</span>
                  <span className="shrink-0 text-primary">{file.status}</span>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Строк: {file.rowsSuccess}/{file.rowsTotal}
                  {file.status === 'SKIPPED' ? ' • дубликат пропущен' : ''}
                </div>
                {file.error ? <div className="mt-1 text-xs text-rose-300">{file.error}</div> : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            После отправки здесь появятся статусы обработки по каждому файлу.
          </p>
        )}
      </div>
    </SectionCard>
  )
}

interface TelegramDlUploadHistoryProps {
  files: TelegramDlImportFile[]
  isLoading: boolean
}

function TelegramDlUploadHistory({ files, isLoading }: TelegramDlUploadHistoryProps) {
  return (
    <SectionCard
      title="История загрузок"
      description="Последние импортированные файлы, пропущенные дубликаты и активные версии появятся здесь."
      className="border border-white/10 bg-[#131316]/90 backdrop-blur-2xl"
      headerClassName="border-white/10"
      contentClassName="space-y-4"
    >
      {isLoading ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-slate-800/30 px-4 py-10 text-center">
          <div className="text-base font-medium text-white">Загружаю историю</div>
          <div className="mt-2 text-sm text-slate-400">Получаю историю файлов из tgmbase.</div>
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-slate-800/30 px-4 py-10 text-center">
          <div className="text-base font-medium text-white">Пока нет загруженных файлов</div>
          <div className="mt-2 text-sm text-slate-400">
            После первой выгрузки здесь появится список файлов, дата загрузки и статус обработки.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="rounded-lg border border-white/10 bg-slate-800/30 px-4 py-3 text-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-white">{file.originalFileName}</span>
                <span
                  className={
                    file.status === 'FAILED'
                      ? 'text-rose-300'
                      : file.status === 'SKIPPED'
                        ? 'text-amber-300'
                        : file.isActive
                          ? 'text-emerald-300'
                          : 'text-slate-400'
                  }
                >
                  {file.status === 'FAILED'
                    ? 'Ошибка'
                    : file.status === 'SKIPPED'
                      ? 'Пропущена'
                      : file.isActive
                        ? 'Активная'
                        : 'Архивная'}
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Статус: {file.status} • Строк: {file.rowsSuccess}/{file.rowsTotal}
              </div>
              {file.error ? <div className="mt-1 text-xs text-rose-300">{file.error}</div> : null}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

interface TelegramDlImportWorkspaceProps {
  files: TelegramDlImportFile[]
  isFilesLoading: boolean
  isUploading: boolean
  uploadStatuses: TelegramDlImportFile[]
  onSubmit: (files: File[]) => Promise<unknown>
}

function TelegramDlImportWorkspace({
  files,
  isFilesLoading,
  isUploading,
  uploadStatuses,
  onSubmit,
}: TelegramDlImportWorkspaceProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <TelegramDlUploadCard
        isUploading={isUploading}
        uploadStatuses={uploadStatuses}
        onSubmit={onSubmit}
      />
      <TelegramDlUploadHistory files={files} isLoading={isFilesLoading} />
    </div>
  )
}

interface TelegramDlMatchToolbarProps {
  viewMode: 'contacts' | 'results'
  contactsCount: number
  matchResultsCount: number
  activeMatchRun: TelegramDlMatchRun | null
  isCreatingMatchRun: boolean
  isExportingMatchRun: boolean
  onRunMatch: () => void
  onShowContacts: () => void
  onExport: () => void
}

function TelegramDlMatchToolbar({
  viewMode,
  contactsCount,
  matchResultsCount,
  activeMatchRun,
  isCreatingMatchRun,
  isExportingMatchRun,
  onRunMatch,
  onShowContacts,
  onExport,
}: TelegramDlMatchToolbarProps) {
  const canExport = activeMatchRun?.status === 'DONE'
  const isRunActive = activeMatchRun?.status === 'RUNNING'
  const statusLabel = viewMode === 'contacts' ? 'Вся база' : 'Результаты последнего запуска'

  return (
    <SectionCard
      title="Матчинг DL"
      description="Рабочий режим для полной DL-базы и результата последнего сопоставления."
      className="border border-white/10 bg-slate-950/80 text-slate-100 shadow-soft-md backdrop-blur-2xl"
      headerClassName="border-white/10"
      contentClassName="space-y-3"
      headerActions={
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={viewMode === 'contacts' ? 'default' : 'outline'}
            onClick={onShowContacts}
            className="gap-2"
          >
            <Table2 className="size-4" />
            Показать всю DL-базу
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onRunMatch}
            disabled={isCreatingMatchRun || isRunActive}
            className="gap-2"
          >
            <Play className="size-4" />
            {isCreatingMatchRun || isRunActive ? 'Проверяю...' : 'Найти совпадения в tgmbase'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onExport}
            disabled={!canExport || isExportingMatchRun}
            className="gap-2"
          >
            <Download className="size-4" />
            {isExportingMatchRun ? 'Выгрузка...' : 'Выгрузить XLSX'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-orange-100">
          Режим: {statusLabel}
        </Badge>
        <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-100">
          DL: {contactsCount}
        </Badge>
        <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-100">
          Совпадения: {matchResultsCount}
        </Badge>
        {activeMatchRun ? (
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-orange-100">
            Запуск: {activeMatchRun.status}
          </Badge>
        ) : (
          <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-300">
            Запуск не выбран
          </Badge>
        )}
      </div>

      {activeMatchRun ? (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Проверено</div>
            <div className="mt-1 text-lg font-semibold text-white">
              {activeMatchRun.contactsTotal}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Совпадений</div>
            <div className="mt-1 text-lg font-semibold text-white">
              {activeMatchRun.matchesTotal}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">ID</div>
            <div className="mt-1 text-lg font-semibold text-white">
              {activeMatchRun.strictMatchesTotal}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Username</div>
            <div className="mt-1 text-lg font-semibold text-white">
              {activeMatchRun.usernameMatchesTotal}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Phone</div>
            <div className="mt-1 text-lg font-semibold text-white">
              {activeMatchRun.phoneMatchesTotal}
            </div>
          </div>
        </div>
      ) : null}
    </SectionCard>
  )
}

interface TelegramDlContactsTableProps {
  contacts: TelegramDlImportContact[]
  total: number
  pageIndex: number
  pageCount: number
  pageSize: number
  isLoading: boolean
  fileFilter: string
  telegramIdFilter: string
  usernameFilter: string
  phoneFilter: string
  onFileFilterChange: (value: string) => void
  onTelegramIdFilterChange: (value: string) => void
  onUsernameFilterChange: (value: string) => void
  onPhoneFilterChange: (value: string) => void
  onNextPage: () => void
  onPreviousPage: () => void
  canGoToNextPage: boolean
  canGoToPreviousPage: boolean
}

function TelegramDlContactsTable({
  contacts,
  total,
  pageIndex,
  pageCount,
  pageSize,
  isLoading,
  fileFilter,
  telegramIdFilter,
  usernameFilter,
  phoneFilter,
  onFileFilterChange,
  onTelegramIdFilterChange,
  onUsernameFilterChange,
  onPhoneFilterChange,
  onNextPage,
  onPreviousPage,
  canGoToNextPage,
  canGoToPreviousPage,
}: TelegramDlContactsTableProps) {
  return (
    <SectionCard
      title="Полная DL-база"
      description="Контакты из выгрузок DL с серверными фильтрами и постраничной загрузкой."
      className="border border-white/10 bg-slate-950/80 text-slate-100 shadow-soft-md backdrop-blur-2xl"
      headerClassName="border-white/10"
      contentClassName="space-y-4"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Input
          value={fileFilter}
          onChange={(event) => onFileFilterChange(event.target.value)}
          placeholder="Файл импорта"
          aria-label="Фильтр по файлу"
        />
        <Input
          value={telegramIdFilter}
          onChange={(event) => onTelegramIdFilterChange(event.target.value)}
          placeholder="telegramId"
          aria-label="Фильтр по telegramId"
        />
        <Input
          value={usernameFilter}
          onChange={(event) => onUsernameFilterChange(event.target.value)}
          placeholder="username"
          aria-label="Фильтр по username"
        />
        <Input
          value={phoneFilter}
          onChange={(event) => onPhoneFilterChange(event.target.value)}
          placeholder="phone"
          aria-label="Фильтр по phone"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-200">
            Показано: {contacts.length}
          </Badge>
          <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-200">
            Всего: {total}
          </Badge>
          <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-200">
            Страница: {pageIndex} / {pageCount}
          </Badge>
          <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-200">
            Лимит: {pageSize}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
            disabled={!canGoToPreviousPage || isLoading}
            className="gap-2"
          >
            <ChevronLeft className="size-4" />
            Предыдущая страница
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={!canGoToNextPage || isLoading}
            className="gap-2"
          >
            Следующая страница
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Загружаю контакты DL" />
      ) : contacts.length === 0 ? (
        <EmptyState
          variant="custom"
          title="Контакты не найдены"
          description="Проверь фильтры или дождись загрузки выгрузок DL."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>Файл</TableHead>
              <TableHead>Контакт</TableHead>
              <TableHead>Идентификаторы</TableHead>
              <TableHead>Источник</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id} className="border-white/10">
                <TableCell className="max-w-[280px] truncate text-slate-100">
                  {contact.originalFileName}
                </TableCell>
                <TableCell className="text-slate-200">
                  <div className="font-medium text-white">
                    {contact.fullName ??
                      [contact.firstName, contact.lastName].filter(Boolean).join(' ')}
                  </div>
                  <div className="text-xs text-slate-400">{contact.region ?? '—'}</div>
                </TableCell>
                <TableCell className="text-slate-200">
                  <div className="space-y-1">
                    <div>telegramId: {contact.telegramId ?? '—'}</div>
                    <div>username: {contact.username ?? '—'}</div>
                    <div>phone: {contact.phone ?? '—'}</div>
                  </div>
                </TableCell>
                <TableCell className="text-slate-300">#{contact.sourceRowIndex}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SectionCard>
  )
}

interface TelegramDlMatchResultRowProps {
  result: TelegramDlMatchResult
  runId: string
  onChatExcluded: (peerId: string) => void
}

function TelegramDlMatchResultRow({
  result,
  runId,
  onChatExcluded,
}: TelegramDlMatchResultRowProps) {
  const queryClient = useQueryClient()
  const [isExpanded, setIsExpanded] = useState(false)

  const messagesQuery = useQuery({
    queryKey: telegramDlUploadQueryKeys.matchResultMessages(runId, result.id),
    queryFn: () => telegramDlUploadService.getMatchResultMessages(runId, result.id),
    enabled: isExpanded,
  })

  const excludeChatMutation = useMutation({
    mutationKey: [...telegramDlUploadQueryKeys.matchRun(runId), 'exclude-chat', result.id] as const,
    mutationFn: (peerId: string) => telegramDlUploadService.excludeChat(runId, peerId),
    onSuccess: async (updatedRun, peerId) => {
      onChatExcluded(peerId)
      queryClient.setQueryData(telegramDlUploadQueryKeys.matchRun(runId), updatedRun)
      queryClient.setQueryData<TelegramDlMatchResult[]>(
        telegramDlUploadQueryKeys.matchResults(runId),
        (current) =>
          current?.reduce<TelegramDlMatchResult[]>((next, item) => {
            const remainingChats =
              item.user?.relatedChats?.filter((chat) => chat.peer_id !== peerId) ?? []
            const nextChatActivityMatch = item.chatActivityMatch && remainingChats.length > 0

            if (
              !item.strictTelegramIdMatch &&
              !item.usernameMatch &&
              !item.phoneMatch &&
              !nextChatActivityMatch
            ) {
              return next
            }

            next.push({
              ...item,
              chatActivityMatch: nextChatActivityMatch,
              user: item.user
                ? {
                    ...item.user,
                    relatedChats: remainingChats,
                  }
                : null,
            })

            return next
          }, []) ?? []
      )
      await queryClient.invalidateQueries({
        queryKey: telegramDlUploadQueryKeys.matchRun(runId),
      })
      await queryClient.invalidateQueries({
        queryKey: telegramDlUploadQueryKeys.matchResults(runId),
      })
      await queryClient.invalidateQueries({
        queryKey: telegramDlUploadQueryKeys.matchResultMessages(runId, result.id),
      })
    },
  })

  return (
    <>
      <TableRow className="border-white/10">
        <TableCell className="text-slate-200">
          <div className="font-medium text-white">
            {result.dlContact.fullName ??
              [result.dlContact.firstName, result.dlContact.lastName].filter(Boolean).join(' ')}
          </div>
          <div className="text-xs text-slate-400">
            telegramId: {result.dlContact.telegramId ?? '—'}
          </div>
          <div className="text-xs text-slate-400">{result.dlContact.originalFileName}</div>
        </TableCell>
        <TableCell className="text-slate-200">
          <div className="font-medium text-white">
            {result.user?.first_name ?? '—'} {result.user?.last_name ?? ''}
          </div>
          <div className="text-xs text-slate-400">username: {result.user?.username ?? '—'}</div>
          <div className="text-xs text-slate-400">phone: {result.user?.phone ?? '—'}</div>
        </TableCell>
        <TableCell className="text-slate-200">
          {result.user?.relatedChats?.length ? (
            <div className="space-y-2">
              <div className="max-h-24 space-y-1 overflow-y-auto pr-2 text-xs text-slate-300">
                {result.user.relatedChats.map((chat) => (
                  <div
                    key={`${chat.type}:${chat.peer_id}`}
                    className="flex items-start justify-between gap-2 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1"
                  >
                    <span>
                      {chat.type}: {chat.title} ({chat.peer_id})
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      disabled={excludeChatMutation.isPending}
                      aria-label={`Исключить чат ${chat.peer_id}`}
                      onClick={() => void excludeChatMutation.mutateAsync(chat.peer_id)}
                    >
                      Исключить
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded((current) => !current)}
              >
                {isExpanded ? 'Скрыть комментарии' : 'Комментарии'}
              </Button>
            </div>
          ) : (
            <div className="text-xs text-slate-500">Нет данных</div>
          )}
        </TableCell>
        <TableCell className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {result.strictTelegramIdMatch ? (
              <Badge className="bg-emerald-400/10 text-emerald-200">ID match</Badge>
            ) : null}
            {result.usernameMatch ? (
              <Badge className="bg-primary/10 text-orange-200">Username match</Badge>
            ) : null}
            {result.phoneMatch ? (
              <Badge className="bg-amber-400/10 text-amber-200">Phone match</Badge>
            ) : null}
            {result.chatActivityMatch ? (
              <Badge className="bg-fuchsia-400/10 text-fuchsia-200">Chat activity match</Badge>
            ) : null}
          </div>
        </TableCell>
      </TableRow>

      {isExpanded ? (
        <TableRow className="border-white/10 bg-white/[0.02]">
          <TableCell colSpan={4} className="space-y-3 px-4 py-4">
            {messagesQuery.isLoading ? (
              <LoadingState message="Загружаю комментарии tgmbase" />
            ) : messagesQuery.data?.length ? (
              <div className="space-y-3">
                {messagesQuery.data.map((group) => (
                  <div
                    key={`${group.chatType}:${group.peerId}`}
                    className="rounded-xl border border-white/10 bg-slate-950/70 p-3"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <div className="text-sm font-medium text-white">
                        {group.chatType}: {group.title} ({group.peerId})
                      </div>
                      {group.isExcluded ? (
                        <Badge variant="outline" className="border-amber-400/30 text-amber-200">
                          Исключён
                        </Badge>
                      ) : null}
                    </div>
                    {group.messages.length ? (
                      <div className="max-h-72 space-y-2 overflow-y-auto pr-2">
                        {group.messages.map((message) => (
                          <div
                            key={message.messageId}
                            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300"
                          >
                            <div className="mb-1 text-[11px] text-slate-500">
                              {message.messageDate ?? 'Без даты'}
                            </div>
                            <div>{message.text ?? 'Пустое сообщение'}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">Комментарии не найдены</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                variant="custom"
                title="Комментарии не найдены"
                description="Для этого результата backend не вернул сообщений по найденным чатам."
              />
            )}
          </TableCell>
        </TableRow>
      ) : null}
    </>
  )
}

interface TelegramDlMatchResultsTableProps {
  results: TelegramDlMatchResult[]
  isLoading: boolean
  activeMatchRun: TelegramDlMatchRun | null
}

function TelegramDlMatchResultsTable({
  results,
  isLoading,
  activeMatchRun,
}: TelegramDlMatchResultsTableProps) {
  const [filter, setFilter] = useState<MatchFilter>('all')
  const [excludedPeerIds, setExcludedPeerIds] = useState<string[]>([])
  const [localResults, setLocalResults] = useState<TelegramDlMatchResult[]>(
    applyExcludedChats(results, [])
  )

  useEffect(() => {
    setLocalResults(applyExcludedChats(results, excludedPeerIds))
  }, [results, excludedPeerIds])

  useEffect(() => {
    setExcludedPeerIds([])
  }, [activeMatchRun?.id])

  const handleChatExcluded = (peerId: string) => {
    setExcludedPeerIds((current) => (current.includes(peerId) ? current : [...current, peerId]))
  }

  const visibleResults = localResults.filter((result) => {
    if (filter === 'strict') {
      return result.strictTelegramIdMatch
    }
    if (filter === 'username') {
      return result.usernameMatch
    }
    if (filter === 'phone') {
      return result.phoneMatch
    }
    if (filter === 'chat') {
      return result.chatActivityMatch
    }
    return true
  })

  return (
    <SectionCard
      title="Совпадения tgmbase"
      description="Сохранённые строки результата для последнего запуска матчинга."
      className="border border-white/10 bg-slate-950/80 text-slate-100 shadow-soft-md backdrop-blur-2xl"
      headerClassName="border-white/10"
      contentClassName="space-y-4"
    >
      <div className="flex flex-wrap gap-2">
        {(Object.keys(filterLabels) as MatchFilter[]).map((mode) => (
          <Button
            key={mode}
            type="button"
            variant={filter === mode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(mode)}
          >
            {filterLabels[mode]}
          </Button>
        ))}
      </div>

      {activeMatchRun ? (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-200">
            Проверено: {activeMatchRun.contactsTotal}
          </Badge>
          <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-200">
            Совпадений: {activeMatchRun.matchesTotal}
          </Badge>
        </div>
      ) : null}

      {isLoading ? (
        <LoadingState message="Загружаю совпадения tgmbase" />
      ) : activeMatchRun?.status === 'RUNNING' ? (
        <EmptyState
          variant="custom"
          title="Матчинг выполняется"
          description="Фоновый запуск обрабатывает DL-контакты батчами. Результаты появятся после завершения."
        />
      ) : activeMatchRun?.status === 'FAILED' ? (
        <EmptyState
          variant="custom"
          title="Матчинг завершился ошибкой"
          description={activeMatchRun.error ?? 'Проверь логи backend и запусти матчинг повторно.'}
        />
      ) : visibleResults.length === 0 ? (
        <EmptyState
          variant="custom"
          title="Совпадения не найдены"
          description="Запусти матчинг или выбери другой фильтр."
        />
      ) : !activeMatchRun?.id ? (
        <EmptyState
          variant="custom"
          title="Нет активного запуска"
          description="Сначала выбери или запусти матчинг."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>DL контакт</TableHead>
              <TableHead>tgmbase user</TableHead>
              <TableHead>Связи tgmbase</TableHead>
              <TableHead>Тип совпадения</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleResults.map((result) => (
              <TelegramDlMatchResultRow
                key={result.id}
                result={result}
                runId={activeMatchRun.id}
                onChatExcluded={handleChatExcluded}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </SectionCard>
  )
}

interface TelegramDlMatchWorkspaceProps {
  state: UseTelegramDlUploadResult
}

function TelegramDlMatchWorkspace({ state }: TelegramDlMatchWorkspaceProps) {
  const {
    contacts,
    contactsTotal,
    contactsPageSize,
    contactsPageIndex,
    contactsPageCount,
    isContactsLoading,
    contactsError,
    contactsFileFilter,
    contactsTelegramIdFilter,
    contactsUsernameFilter,
    contactsPhoneFilter,
    setContactsFileFilter,
    setContactsTelegramIdFilter,
    setContactsUsernameFilter,
    setContactsPhoneFilter,
    goToNextContactsPage,
    goToPreviousContactsPage,
    canGoToNextContactsPage,
    canGoToPreviousContactsPage,
    matchResults,
    isMatchRunLoading,
    matchRunError,
    displayMode,
    activeMatchRun,
    isCreatingMatchRun,
    isExportingMatchRun,
    runMatch,
    showContacts,
    exportActiveRun,
  } = state

  if (contactsError) {
    return (
      <SectionCard
        title="Telegram DL Match"
        className="border border-white/10 bg-slate-950/80 text-slate-100 shadow-soft-md backdrop-blur-2xl"
      >
        <EmptyState
          variant="custom"
          title="Не удалось загрузить DL-контакты"
          description={contactsError instanceof Error ? contactsError.message : 'Ошибка запроса'}
        />
      </SectionCard>
    )
  }

  if (matchRunError && displayMode === 'results') {
    return (
      <SectionCard
        title="Telegram DL Match"
        className="border border-white/10 bg-slate-950/80 text-slate-100 shadow-soft-md backdrop-blur-2xl"
      >
        <EmptyState
          variant="custom"
          title="Не удалось загрузить результаты"
          description={matchRunError instanceof Error ? matchRunError.message : 'Ошибка запроса'}
        />
      </SectionCard>
    )
  }

  return (
    <div className="space-y-4">
      <TelegramDlMatchToolbar
        viewMode={displayMode}
        contactsCount={contactsTotal}
        matchResultsCount={matchResults.length}
        activeMatchRun={activeMatchRun}
        isCreatingMatchRun={isCreatingMatchRun}
        isExportingMatchRun={isExportingMatchRun}
        onRunMatch={() => void runMatch()}
        onShowContacts={showContacts}
        onExport={() => void exportActiveRun()}
      />

      {displayMode === 'contacts' ? (
        <TelegramDlContactsTable
          contacts={contacts}
          total={contactsTotal}
          pageIndex={contactsPageIndex}
          pageCount={contactsPageCount}
          pageSize={contactsPageSize}
          isLoading={isContactsLoading}
          fileFilter={contactsFileFilter}
          telegramIdFilter={contactsTelegramIdFilter}
          usernameFilter={contactsUsernameFilter}
          phoneFilter={contactsPhoneFilter}
          onFileFilterChange={setContactsFileFilter}
          onTelegramIdFilterChange={setContactsTelegramIdFilter}
          onUsernameFilterChange={setContactsUsernameFilter}
          onPhoneFilterChange={setContactsPhoneFilter}
          onNextPage={goToNextContactsPage}
          onPreviousPage={goToPreviousContactsPage}
          canGoToNextPage={canGoToNextContactsPage}
          canGoToPreviousPage={canGoToPreviousContactsPage}
        />
      ) : isMatchRunLoading ? (
        <LoadingState message="Загружаю результаты матчинга" />
      ) : (
        <TelegramDlMatchResultsTable
          results={matchResults}
          isLoading={isMatchRunLoading}
          activeMatchRun={activeMatchRun}
        />
      )}
    </div>
  )
}

export default function TelegramDlUploadPage() {
  const state = useTelegramDlUpload()
  const [activeTab, setActiveTab] = useState<'import' | 'match'>('import')
  const { files, isFilesLoading, uploadFiles, isUploading, uploadResult } = state

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 font-monitoring-body md:px-8">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <PageHeader
          variant="hero"
          title="Выгрузка с ДЛ"
          description="Загружайте несколько XLSX файлов формата groupexport_*.xlsx за один раз. Повторная загрузка с тем же именем файла будет пропущена как дубликат."
          footer={
            <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
              <span className="rounded-full border border-border/60 bg-background-primary/70 px-3 py-1.5">
                Можно выбрать несколько XLSX файлов
              </span>
              <span className="rounded-full border border-border/60 bg-background-primary/70 px-3 py-1.5">
                Дубликаты пропускаются по полному имени файла
              </span>
            </div>
          }
          className="py-1"
        />
      </div>

      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-75">
        <TelegramDlTabs activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        {activeTab === 'import' ? (
          <TelegramDlImportWorkspace
            files={files}
            isFilesLoading={isFilesLoading}
            isUploading={isUploading}
            uploadStatuses={uploadResult?.files ?? []}
            onSubmit={uploadFiles}
          />
        ) : (
          <TelegramDlMatchWorkspace state={state} />
        )}
      </div>
    </div>
  )
}

