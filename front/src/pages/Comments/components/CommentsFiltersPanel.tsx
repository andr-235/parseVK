import SearchInput from '@/components/SearchInput'
import SectionCard from '@/components/SectionCard'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface CommentsFiltersPanelProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  showOnlyKeywordComments: boolean
  onToggleKeywords: (value: boolean) => void
  readFilter: 'all' | 'unread' | 'read'
  onReadFilterChange: (value: 'all' | 'unread' | 'read') => void
  keywordsCount: number
}

const toggleButtonClass = (active: boolean) =>
  cn(
    'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors duration-200',
    active
      ? 'border-transparent bg-accent-primary text-white shadow-soft-sm hover:bg-accent-primary/90'
      : 'border-border bg-background-primary/40 text-text-secondary hover:bg-background-secondary/60',
  )

function CommentsFiltersPanel({
  searchTerm,
  onSearchChange,
  showOnlyKeywordComments,
  onToggleKeywords,
  readFilter,
  onReadFilterChange,
  keywordsCount,
}: CommentsFiltersPanelProps) {
  return (
    <SectionCard
      title="Фильтры и поиск по комментариям"
      headerClassName="border-none pb-4"
      contentClassName="pt-0 space-y-4"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:max-w-md">
          <SearchInput value={searchTerm} onChange={onSearchChange} placeholder="Поиск по автору, тексту или ID" />
        </div>

        <div className="flex flex-wrap items-center gap-4" role="group" aria-label="Фильтр по ключевым словам">
          <Label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Показать</Label>
          <ButtonGroup>
            <Button
              type="button"
              variant="ghost"
              className={toggleButtonClass(!showOnlyKeywordComments)}
              onClick={() => onToggleKeywords(false)}
            >
              Все
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={cn(toggleButtonClass(showOnlyKeywordComments), keywordsCount === 0 && 'cursor-not-allowed opacity-60')}
              onClick={() => onToggleKeywords(true)}
              disabled={keywordsCount === 0}
            >
              С ключевыми словами
            </Button>
          </ButtonGroup>
        </div>

        <div className="flex flex-wrap items-center gap-4" role="group" aria-label="Фильтр по статусу прочтения">
          <Label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Статус</Label>
          <ButtonGroup>
            <Button
              type="button"
              variant="ghost"
              className={toggleButtonClass(readFilter === 'all')}
              onClick={() => onReadFilterChange('all')}
            >
              Все
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={toggleButtonClass(readFilter === 'unread')}
              onClick={() => onReadFilterChange('unread')}
            >
              Непрочитанные
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={toggleButtonClass(readFilter === 'read')}
              onClick={() => onReadFilterChange('read')}
            >
              Прочитанные
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {keywordsCount === 0 && (
        <Label className="text-xs text-text-secondary">Добавьте ключевые слова, чтобы включить фильтр</Label>
      )}
    </SectionCard>
  )
}

export default CommentsFiltersPanel
