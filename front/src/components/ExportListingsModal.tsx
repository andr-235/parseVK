import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'

interface ExportListingsModalProps {
  isOpen: boolean
  onClose: () => void
  defaultSearch?: string
  defaultSource?: string
}

type FieldKey =
  | 'id'
  | 'source'
  | 'externalId'
  | 'title'
  | 'url'
  | 'price'
  | 'currency'
  | 'address'
  | 'city'
  | 'rooms'
  | 'areaTotal'
  | 'areaLiving'
  | 'areaKitchen'
  | 'floor'
  | 'floorsTotal'
  | 'latitude'
  | 'longitude'
  | 'contactName'
  | 'contactPhone'
  | 'publishedAt'
  | 'createdAt'
  | 'updatedAt'
  | 'images'
  | 'description'
  | 'metadata'

const ALL_FIELDS: { key: FieldKey; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'source', label: 'Источник' },
  { key: 'externalId', label: 'Внешний ID' },
  { key: 'title', label: 'Заголовок' },
  { key: 'url', label: 'Ссылка' },
  { key: 'price', label: 'Цена' },
  { key: 'currency', label: 'Валюта' },
  { key: 'address', label: 'Адрес' },
  { key: 'city', label: 'Город' },
  { key: 'rooms', label: 'Комнат' },
  { key: 'areaTotal', label: 'Площадь общая' },
  { key: 'areaLiving', label: 'Площадь жилая' },
  { key: 'areaKitchen', label: 'Площадь кухня' },
  { key: 'floor', label: 'Этаж' },
  { key: 'floorsTotal', label: 'Этажей всего' },
  { key: 'latitude', label: 'Широта' },
  { key: 'longitude', label: 'Долгота' },
  { key: 'contactName', label: 'Контактное лицо' },
  { key: 'contactPhone', label: 'Телефон' },
  { key: 'publishedAt', label: 'Опубликовано' },
  { key: 'createdAt', label: 'Создано' },
  { key: 'updatedAt', label: 'Обновлено' },
  { key: 'images', label: 'Изображения' },
  { key: 'description', label: 'Описание' },
  { key: 'metadata', label: 'Метаданные' },
]

import { listingsService } from '@/services/listingsService'

function ExportListingsModal({ isOpen, onClose, defaultSearch, defaultSource }: ExportListingsModalProps) {
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
        search: scope === 'filtered' ? (defaultSearch?.trim() || undefined) : undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex w-full max-h-[90vh] max-w-4xl flex-col overflow-hidden rounded-3xl bg-background-secondary text-text-primary shadow-soft-lg transition-colors duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-listings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-8 py-6">
          <div className="space-y-2">
            <h2 id="export-listings-title" className="text-2xl font-semibold tracking-tight">
              Экспорт объявлений в CSV
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
              Выберите поля и область выгрузки. По умолчанию учитываются текущие фильтры, но можно выгрузить все.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full bg-background-primary/40 p-2 text-2xl leading-none text-text-secondary transition-colors duration-200 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/60"
            onClick={onClose}
            aria-label="Закрыть модальное окно"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
          <section className="space-y-3">
            <h3 className="text-base font-semibold">Область выгрузки</h3>
            <div className="flex flex-wrap gap-3 rounded-2xl border border-border bg-background-primary/40 p-4 shadow-soft-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="export-scope"
                  value="filtered"
                  checked={scope === 'filtered'}
                  onChange={() => setScope('filtered')}
                  className="h-4 w-4 rounded-full border-border text-accent-primary focus:ring-accent-primary"
                />
                <span className="text-sm">Учитывать текущие фильтры</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="export-scope"
                  value="all"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                  className="h-4 w-4 rounded-full border-border text-accent-primary focus:ring-accent-primary"
                />
                <span className="text-sm">Выгрузить все объявления</span>
              </label>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Поля ({selectedCount}/{ALL_FIELDS.length})</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="inline-flex items-center rounded-full border border-border bg-background-primary/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary transition-colors duration-200 hover:bg-background-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                >
                  Выбрать все
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="inline-flex items-center rounded-full border border-transparent bg-background-secondary/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary transition-colors duration-200 hover:bg-background-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                >
                  Снять
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ALL_FIELDS.map((f) => {
                const checked = selected.has(f.key)
                return (
                  <label key={f.key} className={`flex items-center gap-3 rounded-xl border p-3 ${checked ? 'border-accent-primary/60 bg-background-primary/40' : 'border-border/60 bg-background-primary/20 hover:border-accent-primary/40'}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleField(f.key)}
                      className="h-4 w-4 rounded border-border text-accent-primary focus:ring-accent-primary"
                    />
                    <span className="text-sm">{f.label}</span>
                  </label>
                )
              })}
            </div>
          </section>
        </div>

        <footer className="flex flex-col gap-3 border-t border-border bg-background-secondary/60 px-8 py-6 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Отмена
          </Button>
          <Button type="button" onClick={handleExport} disabled={isExporting || selectedCount === 0} className="w-full sm:w-auto">
            {isExporting ? 'Экспорт…' : 'Экспортировать'}
          </Button>
        </footer>
      </div>
    </div>
  )
}

export default ExportListingsModal
