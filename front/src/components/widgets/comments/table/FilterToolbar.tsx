import { Download, X } from 'lucide-react'
import { Button, Input, Select } from '../../../ui'
import { GROUP_OPTIONS, STATUS_FILTER_OPTIONS } from './constants'

export type FilterToolbarProps = {
  search: string
  onSearchChange: (v: string) => void
  groupFilter: string
  onGroupFilterChange: (v: string) => void
  statusFilter: string
  onStatusFilterChange: (v: string) => void
  onReset: () => void
  selectedCount: number
}

export function FilterToolbar({
  search, onSearchChange,
  groupFilter, onGroupFilterChange,
  statusFilter, onStatusFilterChange,
  onReset, selectedCount,
}: FilterToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <Input
        type="search" value={search} onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Поиск по тексту..."
        aria-label="Поиск по тексту комментариев"
      />
      <Select value={groupFilter} options={GROUP_OPTIONS} onChange={onGroupFilterChange} label="Фильтр по группе" />
      <Select value={statusFilter} options={STATUS_FILTER_OPTIONS} onChange={onStatusFilterChange} label="Фильтр по статусу" />
      <Button variant="secondary" size="xs" onClick={onReset} aria-label="Сбросить все фильтры" icon={<X size={12} />}>
        Сбросить
      </Button>
      <div className="ml-auto flex items-center gap-2">
        {selectedCount > 0 && (
          <span className="text-xs text-text-secondary" role="status">Выбрано: {selectedCount}</span>
        )}
        <ExportButton />
      </div>
    </div>
  )
}

function ExportButton() {
  return (
    <Button variant="secondary" size="xs" aria-label="Экспортировать в Excel">
      <Download size={14} />
      Экспорт
    </Button>
  )
}
