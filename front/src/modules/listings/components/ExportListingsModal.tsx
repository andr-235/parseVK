import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'
import { Spinner } from '@/shared/ui/spinner'
import { Info } from 'lucide-react'

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

// Использование services для одноразовой операции (экспорт данных)
// Это допустимо согласно правилам архитектуры для операций, не требующих состояния
import { listingsService } from '@/services/listingsService'

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

  // ВАЖНО: хуки должны вызываться на каждом рендере в одинаковом порядке.
  // fields вычисляем до возможного раннего возврата.
  const selectedCount = selected.size
  const fields = useMemo(() => Array.from(selected), [selected])

  if (!isOpen) {
    return null
  }

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full max-h-[90vh] max-w-4xl flex-col overflow-hidden rounded-3xl glassmorphic-surface text-foreground transition-colors duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-listings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border/60 px-8 py-6">
          <div className="space-y-2">
            <h2 id="export-listings-title" className="text-2xl font-semibold tracking-tight">
              Экспорт объявлений в CSV
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Выберите поля и область выгрузки. По умолчанию учитываются текущие фильтры, но можно
              выгрузить все.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full bg-background-primary/60 p-2 text-2xl leading-none text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40"
            onClick={onClose}
            aria-label="Закрыть модальное окно"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <h3 className="text-base font-semibold text-foreground">Область выгрузки</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Подсказка"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Info className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Учитывает поля поиска, выбранный источник и размер страницы.
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="relative w-full max-w-xl rounded-xl border border-border/50 bg-background-primary/70 p-1">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  className={`rounded-lg px-4 py-2 text-sm transition-colors ${scope === 'filtered' ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-secondary hover:text-text-primary'}`}
                  onClick={() => setScope('filtered')}
                >
                  Учитывать текущие фильтры
                </button>
                <button
                  type="button"
                  className={`rounded-lg px-4 py-2 text-sm transition-colors ${scope === 'all' ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-secondary hover:text-text-primary'}`}
                  onClick={() => setScope('all')}
                >
                  Выгрузить все
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Поля ({selectedCount}/{ALL_FIELDS.length})
                </h3>
                <div className="text-xs text-muted-foreground">
                  Выбрано: {selectedCount} из {ALL_FIELDS.length}
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-accent-primary hover:text-accent-primary/80 font-medium text-xs"
                >
                  ВЫБРАТЬ ВСЕ
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-accent-primary hover:text-accent-primary/80 font-medium text-xs"
                >
                  СНЯТЬ
                </button>
              </div>
            </div>

            {(() => {
              // Группировка полей по категориям
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

              const labelByKey = Object.fromEntries(
                ALL_FIELDS.map((f) => [f.key, f.label])
              ) as Record<FieldKey, string>

              return (
                <div className="space-y-4">
                  {groups.map((g) => (
                    <div
                      key={g.title}
                      className="rounded-xl border border-border/50 bg-background-primary/70 p-4"
                    >
                      <h4 className="text-foreground font-medium mb-2">{g.title}</h4>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {g.keys.map((key) => {
                          const checked = selected.has(key)
                          return (
                            <label
                              key={key}
                              className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                                checked
                                  ? 'border-accent-primary/40 bg-accent-primary/10'
                                  : 'border-border/50 hover:bg-muted/40'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleToggleField(key)}
                                className="h-4 w-4 rounded border-border text-accent-primary focus:ring-accent-primary"
                              />
                              <span className="text-sm text-foreground">{labelByKey[key]}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </section>
        </div>

        <footer className="flex flex-col gap-3 border-t border-border bg-background-secondary/60 px-8 py-6 sm:flex-row sm:justify-end p-4">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Отмена
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting || selectedCount === 0}
            className="w-full sm:w-auto"
          >
            {isExporting ? (
              <span className="inline-flex items-center gap-2">
                <Spinner className="size-4" /> Экспортируется…
              </span>
            ) : (
              'Экспортировать'
            )}
          </Button>
        </footer>
      </div>
    </div>
  )
}

export default ExportListingsModal
