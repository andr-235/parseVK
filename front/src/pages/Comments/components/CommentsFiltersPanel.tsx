import { Filter as FilterIcon, Search, Sparkles } from 'lucide-react'

import SearchInput from '@/components/SearchInput'
import SectionCard from '@/components/SectionCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { cn } from '@/lib/utils'

interface CommentsFiltersPanelProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  showKeywordComments: boolean
  onToggleKeywordComments: (value: boolean) => void
  showKeywordPosts: boolean
  onToggleKeywordPosts: (value: boolean) => void
  readFilter: 'all' | 'unread' | 'read'
  onReadFilterChange: (value: 'all' | 'unread' | 'read') => void
  keywordsCount: number
}

const toggleButtonClass = (active: boolean) =>
  cn(
    'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    active
      ? 'border-transparent bg-[linear-gradient(135deg,var(--accent-primary),rgba(79,70,229,0.9))] text-white shadow-soft-md'
      : 'border-border/60 bg-background-secondary/40 text-text-secondary hover:border-accent-primary/50 hover:text-text-primary dark:border-white/20 dark:bg-white/10',
  )

const cardBlockClass =
  'space-y-3 rounded-2xl border border-border/60 bg-background-primary/60 p-4 shadow-soft-sm transition-all duration-300 dark:border-white/10 dark:bg-white/5'

function CommentsFiltersPanel({
  searchTerm,
  onSearchChange,
  showKeywordComments,
  onToggleKeywordComments,
  showKeywordPosts,
  onToggleKeywordPosts,
  readFilter,
  onReadFilterChange,
  keywordsCount,
}: CommentsFiltersPanelProps) {
  const readFilters: Array<{ value: 'all' | 'unread' | 'read'; label: string }> = [{ value: 'all', label: 'Все' }, { value: 'unread', label: 'Непрочитанные' }, { value: 'read', label: 'Прочитанные' }]
  const hasAnyKeywordFilter = showKeywordComments || showKeywordPosts

  return (
    <SectionCard
      title="Фильтры и поиск по комментариям"
      description="Комбинируйте поиск, ключевые слова и статус прочтения, чтобы быстрее отбирать нужные сообщения."
      headerClassName="border-none pb-4"
      contentClassName="pt-0"
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="rounded-full border-border/60 bg-background-secondary/60 px-3 py-1 text-[10px] uppercase tracking-[0.32em] text-text-secondary dark:border-white/20 dark:bg-white/10 dark:text-text-light">
                фильтры
              </Badge>
              <div className="flex items-center gap-2 text-sm font-medium text-text-secondary dark:text-text-light/80"><Sparkles className="h-4 w-4 text-accent-primary" />Актуальный режим подбора</div>
            </div>
            {keywordsCount > 0 && <Badge variant="highlight" className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] shadow-soft-sm">{`Ключевых слов: ${keywordsCount}`}</Badge>}
          </div>
          <SearchInput value={searchTerm} onChange={onSearchChange} placeholder="Поиск по автору, тексту или ID" variant="glass" leadingIcon={<Search className="h-4 w-4" />} />
          <p className="text-xs leading-relaxed text-text-secondary dark:text-text-light/75">Поиск реагирует мгновенно и обновляет таблицу без перезагрузки.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className={cardBlockClass}>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary dark:text-text-light/75"><FilterIcon className="h-3.5 w-3.5" />Ключевые слова</span>
              {keywordsCount > 0 && hasAnyKeywordFilter && <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-text-secondary dark:text-text-light">Активен</Badge>}
            </div>
            <div className="flex flex-col gap-2">
              <ButtonGroup className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(toggleButtonClass(showKeywordComments), keywordsCount === 0 && 'cursor-not-allowed opacity-60 hover:border-border/60 hover:text-text-secondary')}
                  onClick={() => onToggleKeywordComments(!showKeywordComments)}
                  disabled={keywordsCount === 0}
                >
                  В комментарии
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(toggleButtonClass(showKeywordPosts), keywordsCount === 0 && 'cursor-not-allowed opacity-60 hover:border-border/60 hover:text-text-secondary')}
                  onClick={() => onToggleKeywordPosts(!showKeywordPosts)}
                  disabled={keywordsCount === 0}
                >
                  В посте
                </Button>
              </ButtonGroup>
              {keywordsCount > 0 && !hasAnyKeywordFilter && (
                <p className="text-xs text-text-secondary dark:text-text-light/70">Выберите фильтр для отображения комментариев с ключевыми словами</p>
              )}
            </div>
          </div>

          <div className={cardBlockClass}>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary dark:text-text-light/75">Статус прочтения</span>
            <ButtonGroup className="flex flex-wrap gap-2">
              {readFilters.map(({ value, label }) => (
                <Button key={value} type="button" variant="ghost" className={toggleButtonClass(readFilter === value)} onClick={() => onReadFilterChange(value)}>
                  {label}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        </div>

        {keywordsCount === 0 && <p className="text-xs text-text-secondary dark:text-text-light/70">Подключите ключевые слова, чтобы выделять приоритетные комментарии.</p>}
      </div>
    </SectionCard>
  )
}

export default CommentsFiltersPanel
