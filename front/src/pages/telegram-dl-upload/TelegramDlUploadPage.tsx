import { useState, useRef } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageShell } from '../../components/layout/PageShell'
import {
  uploadTelegramDlFiles,
  fetchTelegramDlFiles,
  fetchTelegramDlContacts,
} from '../../shared/api/telegram-dl-upload'
import type { DlImportFile } from '../../shared/api/telegram-dl-upload'
import { Button, Input, Select, FeedbackToast, Spinner } from '../../components/ui'
import { useFeedback } from '../../shared/hooks/useFeedback'
import {
  Upload,
  FileSpreadsheet,
  Search,
  Database,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  HelpCircle,
} from 'lucide-react'

const PAGE_SIZE = 15

export function TelegramDlUploadPage() {
  const queryClient = useQueryClient()
  const { feedback, showFeedback, dismissFeedback } = useFeedback()

  // Drag & drop / file selection state
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filtering & pagination state for contacts
  const [searchQuery, setSearchQuery] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [selectedFileId, setSelectedFileId] = useState<string>('active') // 'active' | 'all' | fileId
  const [page, setPage] = useState(1)

  // Queries
  const {
    data: files = [],
    isLoading: isFilesLoading,
    isError: isFilesError,
    refetch: refetchFiles,
  } = useQuery({
    queryKey: ['telegramDlFiles'],
    queryFn: fetchTelegramDlFiles,
  })

  const {
    data: contactsData,
    isLoading: isContactsLoading,
    isError: isContactsError,
    refetch: refetchContacts,
  } = useQuery({
    queryKey: ['telegramDlContacts', selectedFileId, appliedSearch, page],
    queryFn: () =>
      fetchTelegramDlContacts({
        fileId: selectedFileId !== 'active' && selectedFileId !== 'all' ? selectedFileId : undefined,
        activeOnly: selectedFileId === 'active',
        search: appliedSearch || undefined,
        page,
        limit: PAGE_SIZE,
      }),
  })

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: uploadTelegramDlFiles,
    onSuccess: (data) => {
      showFeedback('success', `Импорт успешно запущен. Обработано файлов: ${data.filesTotal}`)
      setSelectedFiles([])
      queryClient.invalidateQueries({ queryKey: ['telegramDlFiles'] })
      queryClient.invalidateQueries({ queryKey: ['telegramDlContacts'] })
    },
    onError: (err: Error) => {
      const errMsg = err?.message || 'Не удалось загрузить файлы'
      showFeedback('error', errMsg)
    },
  })

  // Drag and drop handlers
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files).filter((file) =>
        file.name.endsWith('.xlsx')
      )
      if (filesArray.length === 0) {
        showFeedback('error', 'Разрешены только файлы с расширением .xlsx')
        return
      }
      setSelectedFiles((prev) => [...prev, ...filesArray])
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).filter((file) =>
        file.name.endsWith('.xlsx')
      )
      setSelectedFiles((prev) => [...prev, ...filesArray])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = () => {
    if (selectedFiles.length === 0) return
    uploadMutation.mutate(selectedFiles)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAppliedSearch(searchQuery)
    setPage(1)
  }

  const handleSearchClear = () => {
    setSearchQuery('')
    setAppliedSearch('')
    setPage(1)
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  // Setup options for Select component matching SelectProps<string>
  const filterOptions = [
    'Все активные выгрузки',
    'Все выгрузки (включая замененные)',
    ...files.map((f) => `${f.originalFileName} (${formatDate(f.createdAt)})`),
  ] as const

  const getSelectedFileLabel = (): string => {
    if (selectedFileId === 'active') return 'Все активные выгрузки'
    if (selectedFileId === 'all') return 'Все выгрузки (включая замененные)'
    const file = files.find((f) => f.id === selectedFileId)
    return file ? `${file.originalFileName} (${formatDate(file.createdAt)})` : 'Все активные выгрузки'
  }

  const handleFileFilterChange = (label: string) => {
    if (label === 'Все активные выгрузки') {
      setSelectedFileId('active')
    } else if (label === 'Все выгрузки (включая замененные)') {
      setSelectedFileId('all')
    } else {
      const file = files.find((f) => `${f.originalFileName} (${formatDate(f.createdAt)})` === label)
      if (file) {
        setSelectedFileId(file.id)
      }
    }
    setPage(1)
  }

  return (
    <PageShell title="Выгрузка с ДЛ">
      <div className="space-y-6">
        {/* Info Hero Block */}
        <div className="rounded-lg border border-border bg-bg-panel p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-accent">
              <Info size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Пакетный импорт выгрузок с ДЛ</h2>
              <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                Этот раздел предназначен для импорта списков Telegram-каналов и контактов из файлов Excel формата{' '}
                <code className="rounded bg-bg-hover px-1 py-0.5 text-text-primary font-mono text-[11px]">groupexport_*.xlsx</code>{' '}
                во вспомогательную базу данных <code className="font-mono text-accent">tgmbase</code>.
                Загрузка поддерживает одновременную обработку нескольких файлов.
                Повторная загрузка файла с идентичным именем автоматически заменит и деактивирует предыдущую версию в системе.
              </p>
            </div>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-stretch">
          
          {/* Left Pane (Upload and File History) */}
          <div className="xl:col-span-2 space-y-6 flex flex-col">
            
            {/* Upload Box */}
            <div className="rounded-lg border border-border bg-bg-panel p-4 flex flex-col">
              <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-2">
                <Upload size={14} /> Загрузка файлов
              </h3>
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center border border-dashed rounded-md p-6 cursor-pointer transition-colors duration-150 ${
                  dragActive
                    ? 'border-accent bg-accent-soft'
                    : 'border-border hover:border-text-muted hover:bg-bg-hover'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploadMutation.isPending}
                />
                <Upload className="text-text-muted mb-2" size={28} />
                <span className="text-xs font-semibold text-text-primary text-center">
                  Перетащите файлы сюда или кликните для выбора
                </span>
                <span className="text-[10px] text-text-muted mt-1 text-center">
                  Поддерживаются только .xlsx файлы
                </span>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                  <span className="text-[11px] font-medium text-text-secondary">Выбранные файлы:</span>
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded border border-border bg-bg-main p-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileSpreadsheet size={16} className="text-success shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-text-primary truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-[10px] text-text-muted">{formatSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(idx)
                        }}
                        disabled={uploadMutation.isPending}
                        className="text-text-muted hover:text-danger rounded p-0.5 hover:bg-bg-hover"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Action Button */}
              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <Button
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                    className="w-full flex justify-center items-center gap-2"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <Spinner size={14} />
                        Импортирование...
                      </>
                    ) : (
                      'Начать импорт'
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* History Table */}
            <div className="rounded-lg border border-border bg-bg-panel p-4 flex-1 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary flex items-center gap-2">
                  <Database size={14} /> История загрузок
                </h3>
                <button
                  onClick={() => refetchFiles()}
                  className="text-xs text-accent hover:underline flex items-center gap-1"
                >
                  Обновить
                </button>
              </div>

              {isFilesLoading ? (
                <div className="flex flex-1 items-center justify-center">
                  <Spinner size={24} />
                </div>
              ) : isFilesError ? (
                <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
                  <AlertTriangle className="text-danger mb-2" size={24} />
                  <p className="text-xs text-text-secondary">Не удалось загрузить историю файлов</p>
                  <Button variant="secondary" size="xs" className="mt-2" onClick={() => refetchFiles()}>
                    Повторить
                  </Button>
                </div>
              ) : files.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
                  <Layers className="text-text-muted mb-2" size={24} />
                  <p className="text-xs text-text-secondary">Файлы еще не загружались</p>
                </div>
              ) : (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-bg-sidebar">
                        <th className="p-2 font-semibold text-text-secondary">Файл</th>
                        <th className="p-2 font-semibold text-text-secondary">Загружен</th>
                        <th className="p-2 font-semibold text-text-secondary">Строк (Успех/Всего)</th>
                        <th className="p-2 font-semibold text-text-secondary text-right">Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file: DlImportFile) => (
                        <tr
                          key={file.id}
                          className={`border-b border-border hover:bg-bg-hover transition-colors duration-150 ${
                            !file.isActive ? 'opacity-50' : ''
                          }`}
                        >
                          <td className="p-2 max-w-[150px]">
                            <div className="font-medium text-text-primary truncate" title={file.originalFileName}>
                              {file.originalFileName}
                            </div>
                            {!file.isActive && (
                              <span className="inline-block mt-0.5 text-[9px] bg-bg-hover text-text-muted px-1 rounded border border-border">
                                Заменен
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-text-secondary whitespace-nowrap">
                            {formatDate(file.createdAt)}
                          </td>
                          <td className="p-2 font-mono text-text-secondary">
                            {file.status === 'running' ? (
                              <span className="animate-pulse text-accent">Обработка...</span>
                            ) : (
                              `${file.rowsSuccess}/${file.rowsTotal}`
                            )}
                          </td>
                          <td className="p-2 text-right">
                            {file.status === 'done' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success bg-success-soft px-1.5 py-0.5 rounded">
                                <CheckCircle2 size={10} /> Активен
                              </span>
                            )}
                            {file.status === 'failed' && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-medium text-danger bg-danger-soft px-1.5 py-0.5 rounded cursor-help"
                                title={file.error || 'Ошибка импорта'}
                              >
                                <XCircle size={10} /> Ошибка
                              </span>
                            )}
                            {file.status === 'running' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-warning bg-warning-soft px-1.5 py-0.5 rounded">
                                <Spinner size={14} /> Загрузка
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Right Pane (Contacts Table) */}
          <div className="xl:col-span-3 rounded-lg border border-border bg-bg-panel p-4 flex flex-col min-h-[500px]">
            <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-2">
              <Database size={14} /> База контактов tgmbase
            </h3>

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-end mb-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-[11px] font-medium text-text-secondary mb-1">
                  Фильтр по источнику (файлу)
                </label>
                <Select<string>
                  label="Фильтр по источнику"
                  value={getSelectedFileLabel()}
                  onChange={handleFileFilterChange}
                  options={filterOptions}
                />
              </div>

              <form onSubmit={handleSearchSubmit} className="w-full sm:w-1/2 flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Поиск по ID, username, телефону..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-8"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleSearchClear}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <Button type="submit" variant="secondary" className="px-3">
                  <Search size={14} />
                </Button>
              </form>
            </div>

            {/* Contacts Table Area */}
            {isContactsLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <Spinner size={24} />
              </div>
            ) : isContactsError ? (
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                <AlertTriangle className="text-danger mb-2" size={28} />
                <p className="text-sm font-semibold text-text-primary">Ошибка загрузки данных</p>
                <p className="text-xs text-text-secondary mt-1">
                  Не удалось получить список контактов из tgmbase. Возможно, бэкенд недоступен или база данных не инициализирована.
                </p>
                <Button variant="secondary" size="sm" className="mt-4" onClick={() => refetchContacts()}>
                  Повторить запрос
                </Button>
              </div>
            ) : !contactsData || contactsData.items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-center border border-dashed border-border rounded">
                <HelpCircle className="text-text-muted mb-2" size={28} />
                <p className="text-sm font-semibold text-text-primary">Контакты не найдены</p>
                <p className="text-xs text-text-secondary mt-1">
                  {appliedSearch
                    ? 'По вашему поисковому запросу ничего не найдено.'
                    : 'В базе данных нет записей для выбранного фильтра. Загрузите файлы слева.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="overflow-x-auto flex-1 min-h-0">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-bg-sidebar">
                        <th className="p-2 font-semibold text-text-secondary">Telegram ID</th>
                        <th className="p-2 font-semibold text-text-secondary">Имя / ФИО</th>
                        <th className="p-2 font-semibold text-text-secondary">Username</th>
                        <th className="p-2 font-semibold text-text-secondary">Телефон</th>
                        <th className="p-2 font-semibold text-text-secondary">Регион</th>
                        <th className="p-2 font-semibold text-text-secondary">Дата импорта</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contactsData.items.map((contact) => (
                        <tr
                          key={contact.id}
                          className="border-b border-border hover:bg-bg-hover transition-colors duration-150"
                        >
                          <td className="p-2 font-mono text-text-primary">{contact.telegramId}</td>
                          <td className="p-2 font-medium text-text-primary">
                            {contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || '—'}
                          </td>
                          <td className="p-2">
                            {contact.username ? (
                              <span className="text-accent">@{contact.username}</span>
                            ) : (
                              <span className="text-text-muted">—</span>
                            )}
                          </td>
                          <td className="p-2 font-mono text-text-secondary">{contact.phone || '—'}</td>
                          <td className="p-2 text-text-secondary">{contact.region || '—'}</td>
                          <td className="p-2 text-text-secondary whitespace-nowrap">
                            {formatDate(contact.joinedAt || contact.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between border-t border-border pt-3 mt-3">
                  <span className="text-xs text-text-secondary">
                    Показано {(page - 1) * PAGE_SIZE + 1} –{' '}
                    {Math.min(page * PAGE_SIZE, contactsData.total)} из {contactsData.total}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft size={14} /> Назад
                    </Button>
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * PAGE_SIZE >= contactsData.total}
                      className="flex items-center gap-1"
                    >
                      Вперед <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      <FeedbackToast feedback={feedback} onDismiss={dismissFeedback} />
    </PageShell>
  )
}
