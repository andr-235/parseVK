import { type ChangeEvent, type FormEvent, useEffect, useState, useMemo } from 'react'
import { PageHeader, FiltersPanel, PageContainer } from '@/shared/components/common'
import {
  Plus,
  Upload,
  Download,
  RefreshCw,
  Database,
  Filter,
  Archive,
  PlusCircle,
  Info,
  Edit2,
  FileJson,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { Spinner } from '@/shared/components/ui/spinner'
import FileUpload from '@/shared/components/common/FileUpload'
import { FormModal } from '@/shared/components/common/FormModal'
import { cn } from '@/shared/utils'
import { ListingsInfinite } from '@/pages/listings/components/ListingsInfinite'
import { useListingsViewModel } from '@/pages/listings/hooks/useListingsViewModel'
import { formatSourceLabel } from '@/pages/listings/utils/listingsUtils'
import { listingsService, type CreateListingPayload } from '@/pages/listings/api/listings.api'
import type { IListing, ListingUpdatePayload } from '@/shared/types'
import toast from 'react-hot-toast'

const PAGE_CARDS = [
  { icon: Database, title: 'База объявлений', subtitle: 'Централизованное хранение' },
  { icon: Upload, title: 'Импорт', subtitle: 'Загрузка из источников' },
  { icon: Filter, title: 'Фильтрация', subtitle: 'Поиск и сортировка' },
  { icon: Archive, title: 'Управление', subtitle: 'Статусы и архивация' },
]

function ListingsPage() {
  const {
    pageSize,
    searchTerm,
    appliedSearch,
    sourceFilter,
    archivedFilter,
    isListLoading,
    isExportOpen,
    isImportOpen,
    isCreateOpen,
    noteListing,
    editListing,
    querySource,
    fetchParams,
    filtersKey,
    fetchListingsBatch,
    filterOptions,
    summaryText,
    PAGE_SIZE_OPTIONS,
    setSearchTerm,
    setIsExportOpen,
    setIsImportOpen,
    setIsCreateOpen,
    handleResetSearch,
    handleSourceChange,
    handleArchivedChange,
    handlePageSizeChange,
    handleManualRefresh,
    handleAddNote,
    handleCloseEdit,
    handleListingUpdated,
    handleEditListing,
    handleCloseFullEdit,
    handleFullEditUpdated,
    handleArchive,
    handleDelete,
    sortBy,
    sortOrder,
    handleSortChange,
    handleMetaChange,
    handleItemsChange,
    handleLoadingChange,
  } = useListingsViewModel()

  return (
    <PageContainer maxWidth="1600px" animate={false}>
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <PageHeader
          variant="grid"
          title="Недвижимость"
          description="База объявлений из различных источников. Импорт, просмотр и управление статусами. Фильтрация по источникам и состоянию объявлений."
          actions={
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setIsCreateOpen(true)}
                size="lg"
                className="h-11 bg-accent-primary hover:bg-accent-primary/95 text-text-light font-semibold transition-all duration-200"
              >
                <Plus className="mr-2 w-5 h-5" />
                Добавить
              </Button>
              <Button
                onClick={() => setIsImportOpen(true)}
                size="lg"
                variant="outline"
                className="h-11 border-border/60 bg-background-secondary text-white hover:bg-white/5 hover:border-accent-primary/50 transition-all duration-200"
              >
                <Upload className="mr-2 w-5 h-5" />
                Импорт
              </Button>
              <Button
                onClick={() => setIsExportOpen(true)}
                size="lg"
                variant="outline"
                className="h-11 border-border/60 bg-background-secondary text-white hover:bg-white/5 hover:border-accent-primary/50 transition-all duration-200"
              >
                <Download className="mr-2 w-5 h-5" />
                Экспорт
              </Button>
              <Button
                onClick={handleManualRefresh}
                size="lg"
                variant="outline"
                className="h-11 border-border/60 bg-background-secondary text-white hover:bg-white/5 hover:border-accent-primary/50 transition-all duration-200"
                disabled={isListLoading}
              >
                <RefreshCw className={cn('mr-2 w-5 h-5', isListLoading && 'animate-spin')} />
                Обновить
              </Button>
            </div>
          }
          cards={PAGE_CARDS}
        />
      </div>

      {/* Filters Section */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <FiltersPanel
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Поиск по адресу, описанию..."
        >
          <select
            value={sourceFilter}
            onChange={handleSourceChange}
            className="h-10 rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary min-w-[160px]"
          >
            {filterOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'Все источники' : formatSourceLabel(option)}
              </option>
            ))}
          </select>

          <select
            value={archivedFilter}
            onChange={(e) => handleArchivedChange(e.target.value as 'all' | 'active' | 'archived')}
            className="h-10 rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary min-w-[140px]"
          >
            <option value="all">Все</option>
            <option value="active">Активные</option>
            <option value="archived">В архиве</option>
          </select>

          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="h-10 rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary w-[120px]"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} стр.
              </option>
            ))}
          </select>

          {appliedSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetSearch}
              className="text-xs text-text-secondary hover:text-accent-primary"
            >
              Сбросить поиск
            </Button>
          )}

          <div className="text-xs text-text-secondary ml-auto font-mono-accent">{summaryText}</div>
        </FiltersPanel>
      </div>

      {/* Listings Section */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
        <ListingsInfinite
          fetcher={fetchListingsBatch}
          limit={pageSize}
          filtersKey={filtersKey}
          fetchParams={fetchParams}
          isArchivedView={archivedFilter === 'archived'}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onAddNote={handleAddNote}
          onEdit={handleEditListing}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onSortChange={handleSortChange}
          onMetaChange={handleMetaChange}
          onItemsChange={handleItemsChange}
          onLoadingChange={handleLoadingChange}
        />
      </div>

      <EditListingModal
        listing={noteListing}
        isOpen={Boolean(noteListing)}
        onClose={handleCloseEdit}
        onUpdated={handleListingUpdated}
      />

      <FullEditListingModal
        listing={editListing}
        isOpen={Boolean(editListing)}
        onClose={handleCloseFullEdit}
        onUpdated={handleFullEditUpdated}
      />

      <ExportListingsModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        defaultSearch={appliedSearch}
        defaultSource={querySource}
      />

      <ImportListingsModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={handleManualRefresh}
      />

      <CreateListingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleManualRefresh}
      />
    </PageContainer>
  )
}

export default ListingsPage

// ============================================================================
// LOCAL MODALS (UNIFIED REFACTOR WITH FormModal)
// ============================================================================

// 1. EditListingModal
interface EditListingModalProps {
  listing: IListing | null
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
}

function EditListingModal({ listing, isOpen, onClose, onUpdated }: EditListingModalProps) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen || !listing) {
      setNote('')
      setSaving(false)
      return
    }
    setNote(listing.manualNote ?? '')
  }, [isOpen, listing])

  if (!isOpen || !listing) return null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return

    const payload: ListingUpdatePayload = {}
    const normalizedNote = note.trim()
    const currentNote = listing.manualNote ?? ''
    if (normalizedNote !== currentNote.trim()) {
      payload.manualNote = normalizedNote.length > 0 ? normalizedNote : null
    }

    if (Object.keys(payload).length === 0) {
      toast.success('Изменений нет')
      onClose()
      return
    }

    setSaving(true)
    try {
      await listingsService.updateListing(listing.id, payload)
      onUpdated()
      onClose()
    } catch {
      toast.error('Не удалось обновить примечание')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Ручное примечание"
      description={listing.url}
      icon={<PlusCircle className="h-5 w-5" />}
      isSaving={saving}
      onSubmit={handleSubmit}
      submitText="Сохранить"
      widthClass="max-w-lg"
    >
      <div className="space-y-2 pt-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono-accent">
          Примечание
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={5}
          className="w-full resize-y rounded-xl border border-border bg-background-primary px-3 py-2.5 text-sm text-text-light placeholder:text-text-secondary outline-none transition-all duration-200 focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20"
          placeholder="Введите примечание для этого объявления..."
        />
      </div>
    </FormModal>
  )
}

// 2. ImportListingsModal
interface ImportListingsModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

function ImportListingsModal({ isOpen, onClose, onImportComplete }: ImportListingsModalProps) {
  const [uploadSourceMode, setUploadSourceMode] = useState<'avito' | 'youla' | 'custom'>('avito')
  const [customSource, setCustomSource] = useState('')
  const [updateExisting, setUpdateExisting] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedUploadSource = uploadSourceMode === 'custom' ? customSource : uploadSourceMode

  const handleImportFile = async (file: File) => {
    setIsUploading(true)
    setError(null)
    try {
      await listingsService.importFromJson({
        file,
        source: resolvedUploadSource,
        updateExisting,
      })
      onImportComplete()
      onClose()
    } catch (err) {
      console.error(err)
      setError('Не удалось импортировать объявления. Проверьте формат файла.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Импорт объявлений"
      description="Загрузка данных из JSON"
      icon={<Upload className="h-5 w-5" />}
      isSaving={isUploading}
      widthClass="max-w-md"
    >
      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono-accent">
            Источник данных
          </label>
          <select
            className="h-11 w-full appearance-none rounded-xl border border-border bg-background-primary px-3 text-sm text-text-light outline-none transition-all duration-200 focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20"
            value={uploadSourceMode}
            onChange={(e) => setUploadSourceMode(e.target.value as 'avito' | 'youla' | 'custom')}
          >
            <option value="avito">Авито</option>
            <option value="youla">Юла</option>
            <option value="custom">Другое...</option>
          </select>
        </div>

        {uploadSourceMode === 'custom' && (
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono-accent">
              Название источника
            </label>
            <Input
              value={customSource}
              onChange={(e) => setCustomSource(e.target.value)}
              placeholder="Например, Циан"
              className="h-11 border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20 transition-all duration-200"
            />
          </div>
        )}

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background-secondary/50 p-3 transition-all hover:bg-background-sidebar">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border bg-background-primary text-accent-primary focus:ring-accent-primary/20"
            checked={updateExisting}
            onChange={(e) => setUpdateExisting(e.target.checked)}
          />
          <span className="text-sm text-text-primary font-monitoring-body">
            Обновлять существующие записи
          </span>
        </label>

        <div className="flex gap-3 rounded-xl border border-border bg-background-secondary/30 p-4">
          <FileJson className="mt-0.5 h-4 w-4 shrink-0 text-accent-primary" />
          <p className="text-xs leading-relaxed text-text-secondary font-monitoring-body">
            Поддерживаются JSON-файлы, содержащие массив объявлений или объект с полем{' '}
            <code className="font-mono-accent font-bold text-accent-primary">listings</code>.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs text-destructive font-monitoring-body">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-border mt-4">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="h-10 border-border bg-transparent text-text-secondary hover:bg-background-primary hover:text-text-light transition-all"
          >
            Отмена
          </Button>
          <FileUpload
            accept="application/json,.json"
            onFilesSelect={([file]) => handleImportFile(file)}
            disabled={isUploading}
            isLoading={isUploading}
            buttonText={isUploading ? 'Загрузка...' : 'Выбрать файл'}
            buttonClassName="h-10 bg-accent-primary text-text-light hover:bg-accent-primary/95 font-semibold transition-all px-4 rounded-lg"
            uploadIcon={isUploading ? <Spinner className="size-4" /> : <></>}
          />
        </div>
      </div>
    </FormModal>
  )
}

// 3. ExportListingsModal
interface ExportListingsModalProps {
  isOpen: boolean
  onClose: () => void
  defaultSearch?: string
  defaultSource?: string
}

type FieldKey =
  | 'id'
  | 'source'
  | 'title'
  | 'url'
  | 'price'
  | 'address'
  | 'sourceAuthorName'
  | 'sourceAuthorPhone'
  | 'sourceAuthorUrl'
  | 'postedAt'
  | 'parsedAt'
  | 'description'
  | 'manualNote'

const ALL_FIELDS: { key: FieldKey; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'source', label: 'Источник' },
  { key: 'title', label: 'Заголовок' },
  { key: 'url', label: 'Ссылка' },
  { key: 'price', label: 'Цена' },
  { key: 'address', label: 'Адрес' },
  { key: 'sourceAuthorName', label: 'Имя продавца' },
  { key: 'sourceAuthorPhone', label: 'Телефон продавца' },
  { key: 'sourceAuthorUrl', label: 'Ссылка на продавца' },
  { key: 'postedAt', label: 'Дата публикации' },
  { key: 'parsedAt', label: 'Дата парсинга' },
  { key: 'description', label: 'Описание' },
  { key: 'manualNote', label: 'Примечание' },
]

function ExportListingsModal({
  isOpen,
  onClose,
  defaultSearch,
  defaultSource,
}: ExportListingsModalProps) {
  const [scope, setScope] = useState<'filtered' | 'all'>('filtered')
  const [selected, setSelected] = useState<Set<FieldKey>>(new Set(ALL_FIELDS.map((f) => f.key)))
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setScope('filtered')
      setSelected(new Set(ALL_FIELDS.map((f) => f.key)))
      setIsExporting(false)
    }
  }, [isOpen])

  const selectedCount = selected.size
  const fields = useMemo(() => Array.from(selected), [selected])

  const handleToggleField = (key: FieldKey) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleSelectAll = () => setSelected(new Set(ALL_FIELDS.map((f) => f.key)))
  const handleDeselectAll = () => setSelected(new Set())

  const handleExport = async () => {
    if (isExporting || selectedCount === 0) return
    setIsExporting(true)
    try {
      await listingsService.exportCsv({
        search: scope === 'filtered' ? defaultSearch?.trim() || undefined : undefined,
        source: scope === 'filtered' ? defaultSource : undefined,
        all: scope === 'all',
        fields,
      })
      onClose()
    } finally {
      setIsExporting(false)
    }
  }

  const groups: { title: string; keys: FieldKey[] }[] = [
    {
      title: 'Общие',
      keys: ['id', 'source', 'title', 'url', 'price', 'postedAt', 'parsedAt'],
    },
    {
      title: 'Контакты',
      keys: ['sourceAuthorName', 'sourceAuthorPhone', 'sourceAuthorUrl'],
    },
    { title: 'Гео', keys: ['address'] },
    { title: 'Прочее', keys: ['description', 'manualNote'] },
  ]

  const labelByKey = Object.fromEntries(ALL_FIELDS.map((f) => [f.key, f.label])) as Record<
    FieldKey,
    string
  >

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Экспорт объявлений в CSV"
      description="Выберите поля и область выгрузки для экспорта."
      icon={<Download className="h-5 w-5" />}
      isSaving={isExporting}
      onSubmit={handleExport}
      submitText="Экспортировать"
      widthClass="max-w-4xl"
    >
      <div className="space-y-6 pt-2">
        <section className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <h3 className="text-sm font-semibold text-text-light font-monitoring-body">
              Область выгрузки
            </h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Подсказка"
                  className="text-text-secondary hover:text-text-light transition-colors"
                >
                  <Info className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-background-sidebar border-border text-text-primary text-xs">
                Учитывает поля поиска, выбранный источник и размер страницы.
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="relative w-full max-w-xl rounded-xl border border-border bg-background-primary p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                className={`rounded-lg px-4 py-2 text-sm transition-all ${
                  scope === 'filtered'
                    ? 'bg-accent-primary/10 text-accent-primary font-medium'
                    : 'text-text-secondary hover:text-text-light'
                }`}
                onClick={() => setScope('filtered')}
              >
                Учитывать текущие фильтры
              </button>
              <button
                type="button"
                className={`rounded-lg px-4 py-2 text-sm transition-all ${
                  scope === 'all'
                    ? 'bg-accent-primary/10 text-accent-primary font-medium'
                    : 'text-text-secondary hover:text-text-light'
                }`}
                onClick={() => setScope('all')}
              >
                Выгрузить все
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-text-light font-monitoring-body">
                Поля ({selectedCount}/{ALL_FIELDS.length})
              </h3>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-accent-primary hover:text-accent-primary/80 font-medium text-xs font-mono-accent"
              >
                ВЫБРАТЬ ВСЕ
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-accent-primary hover:text-accent-primary/80 font-medium text-xs font-mono-accent"
              >
                СНЯТЬ
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {groups.map((g) => (
              <div
                key={g.title}
                className="rounded-xl border border-border bg-background-primary/40 p-4"
              >
                <h4 className="text-text-light font-semibold text-xs uppercase tracking-wider mb-3 font-mono-accent">
                  {g.title}
                </h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {g.keys.map((key) => {
                    const checked = selected.has(key)
                    return (
                      <label
                        key={key}
                        className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                          checked
                            ? 'border-accent-primary/45 bg-accent-primary/5 text-text-light'
                            : 'border-border bg-transparent text-text-secondary hover:bg-background-primary hover:text-text-light'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleField(key)}
                          className="h-4 w-4 rounded border-border text-accent-primary focus:ring-accent-primary/20"
                        />
                        <span className="text-xs font-medium font-monitoring-body">
                          {labelByKey[key]}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </FormModal>
  )
}

// 4. CreateListingModal
interface CreateListingModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

const CURRENCY_OPTIONS = ['RUB', 'USD', 'EUR']

const EMPTY_FORM: CreateListingPayload = {
  url: '',
  title: '',
  description: '',
  price: null,
  currency: 'RUB',
  source: '',
  address: '',
  city: '',
  rooms: null,
  areaTotal: null,
  floor: null,
  floorsTotal: null,
  contactName: '',
  contactPhone: '',
  sourceAuthorUrl: '',
  publishedAt: null,
}

function LocalLabeledField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary font-mono-accent">
        {label}
      </label>
      {children}
    </div>
  )
}

function CreateListingModal({ isOpen, onClose, onCreated }: CreateListingModalProps) {
  const [form, setForm] = useState<CreateListingPayload>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setField = <K extends keyof CreateListingPayload>(
    key: K,
    value: CreateListingPayload[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleStringChange =
    (key: keyof CreateListingPayload) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setField(key, e.target.value as CreateListingPayload[typeof key])
    }

  const handleNumberChange =
    (key: keyof CreateListingPayload) => (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      if (raw === '') {
        setField(key, null as CreateListingPayload[typeof key])
      } else {
        const n = Number.parseFloat(raw)
        setField(key, (Number.isNaN(n) ? null : n) as CreateListingPayload[typeof key])
      }
    }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.url.trim()) {
      setError('URL объявления обязателен')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      await listingsService.createListing({ ...form, url: form.url.trim() })
      setForm(EMPTY_FORM)
      onCreated()
      onClose()
    } catch {
      setError('Не удалось создать объявление. Проверьте данные.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (isSaving) return
    setForm(EMPTY_FORM)
    setError(null)
    onClose()
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Добавить объявление"
      description="Заполните данные вручную"
      icon={<PlusCircle className="h-5 w-5" />}
      isSaving={isSaving}
      onSubmit={handleSubmit}
      submitText="Добавить"
      error={error}
      widthClass="max-w-xl"
    >
      <div className="space-y-4 pt-2">
        <LocalLabeledField label="URL объявления *">
          <Input
            value={form.url}
            onChange={handleStringChange('url')}
            placeholder="https://avito.ru/..."
            className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20"
            autoFocus
          />
        </LocalLabeledField>

        <LocalLabeledField label="Заголовок">
          <Input
            value={form.title ?? ''}
            onChange={handleStringChange('title')}
            placeholder="1-комн. квартира, 35 м²"
            className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20"
          />
        </LocalLabeledField>

        <div className="grid grid-cols-2 gap-3">
          <LocalLabeledField label="Цена">
            <Input
              type="number"
              value={form.price ?? ''}
              onChange={handleNumberChange('price')}
              placeholder="5 000 000"
              className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20"
            />
          </LocalLabeledField>
          <LocalLabeledField label="Валюта">
            <select
              className="h-10 w-full appearance-none rounded-xl border border-border bg-background-primary px-3 text-sm text-text-light outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20"
              value={form.currency ?? 'RUB'}
              onChange={handleStringChange('currency')}
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </LocalLabeledField>
        </div>

        <LocalLabeledField label="Источник">
          <Input
            value={form.source ?? ''}
            onChange={handleStringChange('source')}
            placeholder="avito, cian, youla…"
            className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20"
          />
        </LocalLabeledField>

        <div className="grid grid-cols-2 gap-3">
          <LocalLabeledField label="Город">
            <Input
              value={form.city ?? ''}
              onChange={handleStringChange('city')}
              placeholder="Москва"
              className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary"
            />
          </LocalLabeledField>
          <LocalLabeledField label="Адрес">
            <Input
              value={form.address ?? ''}
              onChange={handleStringChange('address')}
              placeholder="ул. Ленина, 1"
              className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary"
            />
          </LocalLabeledField>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <LocalLabeledField label="Комнат">
            <Input
              type="number"
              value={form.rooms ?? ''}
              onChange={handleNumberChange('rooms')}
              placeholder="2"
              className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary"
            />
          </LocalLabeledField>
          <LocalLabeledField label="Площадь м²">
            <Input
              type="number"
              value={form.areaTotal ?? ''}
              onChange={handleNumberChange('areaTotal')}
              placeholder="52"
              className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary"
            />
          </LocalLabeledField>
          <LocalLabeledField label="Этаж">
            <Input
              type="number"
              value={form.floor ?? ''}
              onChange={handleNumberChange('floor')}
              placeholder="5"
              className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary"
            />
          </LocalLabeledField>
          <LocalLabeledField label="Этажей">
            <Input
              type="number"
              value={form.floorsTotal ?? ''}
              onChange={handleNumberChange('floorsTotal')}
              placeholder="10"
              className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary"
            />
          </LocalLabeledField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <LocalLabeledField label="Имя контакта">
            <Input
              value={form.contactName ?? ''}
              onChange={handleStringChange('contactName')}
              placeholder="Иван Иванов"
              className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary"
            />
          </LocalLabeledField>
          <LocalLabeledField label="Телефон">
            <Input
              value={form.contactPhone ?? ''}
              onChange={handleStringChange('contactPhone')}
              placeholder="+7 999 000 00 00"
              className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary"
            />
          </LocalLabeledField>
        </div>

        <LocalLabeledField label="URL автора">
          <Input
            value={form.sourceAuthorUrl ?? ''}
            onChange={handleStringChange('sourceAuthorUrl')}
            placeholder="https://vk.com/id123"
            className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary"
          />
        </LocalLabeledField>

        <LocalLabeledField label="Дата публикации">
          <Input
            type="date"
            value={form.publishedAt ? form.publishedAt.slice(0, 10) : ''}
            onChange={(e) => {
              const val = e.target.value
              setField('publishedAt', val ? `${val}T00:00:00.000Z` : null)
            }}
            className="h-10 border-border bg-background-primary text-text-light"
          />
        </LocalLabeledField>

        <LocalLabeledField label="Описание">
          <textarea
            value={form.description ?? ''}
            onChange={handleStringChange('description')}
            placeholder="Описание объявления…"
            rows={3}
            className="w-full resize-y rounded-xl border border-border bg-background-primary px-3 py-2.5 text-sm text-text-light placeholder:text-text-secondary outline-none transition-all duration-200 focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20"
          />
        </LocalLabeledField>
      </div>
    </FormModal>
  )
}

// 5. FullEditListingModal
interface FullEditListingModalProps {
  listing: IListing | null
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
}

interface FullFormState {
  title: string
  url: string
  description: string
  source: string
  price: string
  currency: string
  city: string
  address: string
  latitude: string
  longitude: string
  rooms: string
  areaTotal: string
  areaLiving: string
  areaKitchen: string
  floor: string
  floorsTotal: string
  contactName: string
  contactPhone: string
  sourceAuthorName: string
  sourceAuthorPhone: string
  sourceAuthorUrl: string
  publishedAt: string
  sourcePostedAt: string
  manualNote: string
}

function toFullFormState(listing: IListing): FullFormState {
  return {
    title: listing.title ?? '',
    url: listing.url ?? '',
    description: listing.description ?? '',
    source: listing.source ?? '',
    price: listing.price != null ? String(listing.price) : '',
    currency: listing.currency ?? '',
    city: listing.city ?? '',
    address: listing.address ?? '',
    latitude: listing.latitude != null ? String(listing.latitude) : '',
    longitude: listing.longitude != null ? String(listing.longitude) : '',
    rooms: listing.rooms != null ? String(listing.rooms) : '',
    areaTotal: listing.areaTotal != null ? String(listing.areaTotal) : '',
    areaLiving: listing.areaLiving != null ? String(listing.areaLiving) : '',
    areaKitchen: listing.areaKitchen != null ? String(listing.areaKitchen) : '',
    floor: listing.floor != null ? String(listing.floor) : '',
    floorsTotal: listing.floorsTotal != null ? String(listing.floorsTotal) : '',
    contactName: listing.contactName ?? '',
    contactPhone: listing.contactPhone ?? '',
    sourceAuthorName: listing.sourceAuthorName ?? '',
    sourceAuthorPhone: listing.sourceAuthorPhone ?? '',
    sourceAuthorUrl: listing.sourceAuthorUrl ?? '',
    publishedAt: listing.publishedAt ? listing.publishedAt.slice(0, 16) : '',
    sourcePostedAt: listing.sourcePostedAt ?? '',
    manualNote: listing.manualNote ?? '',
  }
}

function buildFullPayload(form: FullFormState, original: IListing): ListingUpdatePayload {
  const payload: ListingUpdatePayload = {}

  const str = (val: string): string | null => val.trim() || null
  const num = (val: string): number | null => {
    const n = Number(val.trim())
    return val.trim() !== '' && Number.isFinite(n) ? n : null
  }

  if ((str(form.title) ?? null) !== (original.title ?? null)) payload.title = str(form.title)
  if ((str(form.url) ?? '') !== original.url) payload.url = form.url.trim() || undefined
  if ((str(form.description) ?? null) !== (original.description ?? null))
    payload.description = str(form.description)
  if ((str(form.source) ?? null) !== (original.source ?? null)) payload.source = str(form.source)
  if (num(form.price) !== (original.price ?? null)) payload.price = num(form.price)
  if ((str(form.currency) ?? null) !== (original.currency ?? null))
    payload.currency = str(form.currency)
  if ((str(form.city) ?? null) !== (original.city ?? null)) payload.city = str(form.city)
  if ((str(form.address) ?? null) !== (original.address ?? null))
    payload.address = str(form.address)
  if (num(form.latitude) !== (original.latitude ?? null)) payload.latitude = num(form.latitude)
  if (num(form.longitude) !== (original.longitude ?? null)) payload.longitude = num(form.longitude)
  if (num(form.rooms) !== (original.rooms ?? null))
    payload.rooms = num(form.rooms) !== null ? Math.round(num(form.rooms)!) : null
  if (num(form.areaTotal) !== (original.areaTotal ?? null)) payload.areaTotal = num(form.areaTotal)
  if (num(form.areaLiving) !== (original.areaLiving ?? null))
    payload.areaLiving = num(form.areaLiving)
  if (num(form.areaKitchen) !== (original.areaKitchen ?? null))
    payload.areaKitchen = num(form.areaKitchen)
  if (num(form.floor) !== (original.floor ?? null))
    payload.floor = num(form.floor) !== null ? Math.round(num(form.floor)!) : null
  if (num(form.floorsTotal) !== (original.floorsTotal ?? null))
    payload.floorsTotal = num(form.floorsTotal) !== null ? Math.round(num(form.floorsTotal)!) : null
  if ((str(form.contactName) ?? null) !== (original.contactName ?? null))
    payload.contactName = str(form.contactName)
  if ((str(form.contactPhone) ?? null) !== (original.contactPhone ?? null))
    payload.contactPhone = str(form.contactPhone)
  if ((str(form.sourceAuthorName) ?? null) !== (original.sourceAuthorName ?? null))
    payload.sourceAuthorName = str(form.sourceAuthorName)
  if ((str(form.sourceAuthorPhone) ?? null) !== (original.sourceAuthorPhone ?? null))
    payload.sourceAuthorPhone = str(form.sourceAuthorPhone)
  if ((str(form.sourceAuthorUrl) ?? null) !== (original.sourceAuthorUrl ?? null))
    payload.sourceAuthorUrl = str(form.sourceAuthorUrl)
  if ((str(form.sourcePostedAt) ?? null) !== (original.sourcePostedAt ?? null))
    payload.sourcePostedAt = str(form.sourcePostedAt)
  if ((str(form.manualNote) ?? null) !== (original.manualNote ?? null))
    payload.manualNote = str(form.manualNote)

  const publishedAtVal = form.publishedAt.trim() ? new Date(form.publishedAt).toISOString() : null
  const originalPublishedAt = original.publishedAt ?? null
  if (publishedAtVal !== originalPublishedAt) payload.publishedAt = publishedAtVal

  return payload
}

const inputClass =
  'w-full rounded-xl border border-border bg-background-primary px-3 py-2 text-sm text-text-light placeholder:text-text-secondary outline-none transition-all duration-200 focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20'

function LocalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary font-mono-accent">
        {label}
      </label>
      {children}
    </div>
  )
}

function LocalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 bg-background-primary/20 p-4 rounded-xl border border-border">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent-primary font-mono-accent">
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function FullEditListingModal({ listing, isOpen, onClose, onUpdated }: FullEditListingModalProps) {
  const [form, setForm] = useState<FullFormState | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!listing) {
      setForm(null)
      setSaving(false)
      return
    }
    setForm(toFullFormState(listing))
  }, [listing])

  if (!listing || !form) return null

  const set =
    (field: keyof FullFormState) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => prev && { ...prev, [field]: e.target.value })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (saving) return

    const payload = buildFullPayload(form, listing)
    if (Object.keys(payload).length === 0) {
      onClose()
      return
    }

    setSaving(true)
    try {
      await listingsService.updateListing(listing.id, payload)
      onUpdated()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Редактировать объявление"
      description={listing.url}
      icon={<Edit2 className="h-5 w-5" />}
      isSaving={saving}
      onSubmit={handleSubmit}
      submitText="Сохранить"
      widthClass="max-w-2xl"
    >
      <div className="space-y-4 pt-2">
        <LocalSection title="Основное">
          <LocalField label="Заголовок">
            <input
              className={inputClass}
              value={form.title}
              onChange={set('title')}
              placeholder="Заголовок объявления"
            />
          </LocalField>
          <LocalField label="URL">
            <input
              className={inputClass}
              value={form.url}
              onChange={set('url')}
              placeholder="https://..."
            />
          </LocalField>
          <LocalField label="Источник">
            <input
              className={inputClass}
              value={form.source}
              onChange={set('source')}
              placeholder="vk, avito, …"
            />
          </LocalField>
          <LocalField label="Описание">
            <textarea
              className={`${inputClass} resize-y`}
              rows={3}
              value={form.description}
              onChange={set('description')}
              placeholder="Описание"
            />
          </LocalField>
        </LocalSection>

        <LocalSection title="Цена">
          <div className="grid grid-cols-2 gap-3">
            <LocalField label="Цена">
              <input
                className={inputClass}
                type="number"
                value={form.price}
                onChange={set('price')}
                placeholder="0"
              />
            </LocalField>
            <LocalField label="Валюта">
              <input
                className={inputClass}
                value={form.currency}
                onChange={set('currency')}
                placeholder="₽"
              />
            </LocalField>
          </div>
        </LocalSection>

        <LocalSection title="Расположение">
          <div className="grid grid-cols-2 gap-3">
            <LocalField label="Город">
              <input
                className={inputClass}
                value={form.city}
                onChange={set('city')}
                placeholder="Москва"
              />
            </LocalField>
            <LocalField label="Адрес">
              <input
                className={inputClass}
                value={form.address}
                onChange={set('address')}
                placeholder="ул. Примерная, 1"
              />
            </LocalField>
            <LocalField label="Широта">
              <input
                className={inputClass}
                type="number"
                step="any"
                value={form.latitude}
                onChange={set('latitude')}
                placeholder="55.75"
              />
            </LocalField>
            <LocalField label="Долгота">
              <input
                className={inputClass}
                type="number"
                step="any"
                value={form.longitude}
                onChange={set('longitude')}
                placeholder="37.61"
              />
            </LocalField>
          </div>
        </LocalSection>

        <LocalSection title="Параметры объекта">
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-1">
              <LocalField label="Комнат">
                <input
                  className={inputClass}
                  type="number"
                  value={form.rooms}
                  onChange={set('rooms')}
                  placeholder="1"
                />
              </LocalField>
            </div>
            <div className="col-span-1">
              <LocalField label="Площадь м²">
                <input
                  className={inputClass}
                  type="number"
                  step="any"
                  value={form.areaTotal}
                  onChange={set('areaTotal')}
                  placeholder="33"
                />
              </LocalField>
            </div>
            <div className="col-span-1">
              <LocalField label="Жилая м²">
                <input
                  className={inputClass}
                  type="number"
                  step="any"
                  value={form.areaLiving}
                  onChange={set('areaLiving')}
                  placeholder="18"
                />
              </LocalField>
            </div>
            <div className="col-span-1">
              <LocalField label="Кухня м²">
                <input
                  className={inputClass}
                  type="number"
                  step="any"
                  value={form.areaKitchen}
                  onChange={set('areaKitchen')}
                  placeholder="6"
                />
              </LocalField>
            </div>
            <div className="col-span-1">
              <LocalField label="Этаж">
                <input
                  className={inputClass}
                  type="number"
                  value={form.floor}
                  onChange={set('floor')}
                  placeholder="3"
                />
              </LocalField>
            </div>
          </div>
          <LocalField label="Этажей в здании">
            <input
              className={inputClass}
              type="number"
              value={form.floorsTotal}
              onChange={set('floorsTotal')}
              placeholder="9"
            />
          </LocalField>
        </LocalSection>

        <LocalSection title="Контакты продавца">
          <div className="grid grid-cols-2 gap-3">
            <LocalField label="Имя">
              <input
                className={inputClass}
                value={form.contactName}
                onChange={set('contactName')}
                placeholder="Иван"
              />
            </LocalField>
            <LocalField label="Телефон">
              <input
                className={inputClass}
                value={form.contactPhone}
                onChange={set('contactPhone')}
                placeholder="+7..."
              />
            </LocalField>
          </div>
        </LocalSection>

        <LocalSection title="Источник и Автор">
          <div className="grid grid-cols-2 gap-3">
            <LocalField label="Имя автора">
              <input
                className={inputClass}
                value={form.sourceAuthorName}
                onChange={set('sourceAuthorName')}
                placeholder="Продавец"
              />
            </LocalField>
            <LocalField label="Телефон автора">
              <input
                className={inputClass}
                value={form.sourceAuthorPhone}
                onChange={set('sourceAuthorPhone')}
                placeholder="+7..."
              />
            </LocalField>
            <LocalField label="URL автора">
              <input
                className={inputClass}
                value={form.sourceAuthorUrl}
                onChange={set('sourceAuthorUrl')}
                placeholder="https://..."
              />
            </LocalField>
            <LocalField label="Опубликовано на источнике">
              <input
                className={inputClass}
                value={form.sourcePostedAt}
                onChange={set('sourcePostedAt')}
                placeholder="Вчера в 12:00"
              />
            </LocalField>
          </div>
        </LocalSection>

        <LocalSection title="Даты и заметки">
          <LocalField label="Дата публикации (системная)">
            <input
              className={inputClass}
              type="datetime-local"
              value={form.publishedAt}
              onChange={set('publishedAt')}
            />
          </LocalField>
          <LocalField label="Ручное примечание">
            <textarea
              className={`${inputClass} resize-y`}
              rows={3}
              value={form.manualNote}
              onChange={set('manualNote')}
              placeholder="Заметки по объявлению"
            />
          </LocalField>
        </LocalSection>
      </div>
    </FormModal>
  )
}
