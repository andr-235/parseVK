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
    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background backdrop-blur-sm',
    active
      ? 'border border-transparent bg-[linear-gradient(135deg,var(--accent-primary),#6366f1)] text-white shadow-[0_20px_50px_-30px_rgba(99,102,241,0.9)] dark:bg-[linear-gradient(135deg,#3b82f6,#2563eb)] dark:shadow-[0_25px_60px_-35px_rgba(37,99,235,0.9)]'
      : 'border border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(226,232,240,0.55))] text-text-secondary/90 shadow-[0_12px_35px_-28px_rgba(15,23,42,0.2)] hover:border-accent-primary/60 hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(59,130,246,0.16))] hover:text-accent-primary dark:border-white/12 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.45),rgba(15,23,42,0.18))] dark:text-text-light/75 dark:shadow-[0_20px_45px_-30px_rgba(15,23,42,0.55)] dark:hover:border-accent-primary/50 dark:hover:bg-[linear-gradient(135deg,rgba(59,130,246,0.35),rgba(37,99,235,0.25))] dark:hover:text-text-light',
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
      description="Комбинируйте поиск, ключевые слова и статус прочтения, чтобы быстрее отбирать нужные сообщения."
      headerClassName="border-none pb-4"
      contentClassName="pt-0 space-y-5"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="w-full xl:max-w-md">
          <SearchInput value={searchTerm} onChange={onSearchChange} placeholder="Поиск по автору, тексту или ID" />
          <p className="mt-2 text-xs text-text-secondary dark:text-text-light/80">
            Поле поиска фильтрует авторов, текст и идентификаторы в таблице.
          </p>
        </div>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex flex-col gap-3">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary dark:text-text-light/80">
              Показать
            </Label>
            <ButtonGroup className="flex flex-wrap gap-2">
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
                className={cn(
                  toggleButtonClass(showOnlyKeywordComments),
                  keywordsCount === 0 && 'cursor-not-allowed opacity-60 hover:border-border hover:text-text-secondary',
                )}
                onClick={() => onToggleKeywords(true)}
                disabled={keywordsCount === 0}
              >
                <span className="flex items-center gap-2">
                  С ключевыми словами
                  {keywordsCount > 0 && (
                    <span
                      className={cn(
                        'inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-[10px] font-semibold leading-none',
                        showOnlyKeywordComments
                          ? 'bg-white/20 text-white shadow-[0_10px_30px_-20px_rgba(255,255,255,0.6)] backdrop-blur-sm'
                          : 'bg-accent-primary/15 text-accent-primary dark:bg-white/10 dark:text-text-light',
                      )}
                    >
                      {keywordsCount}
                    </span>
                  )}
                </span>
              </Button>
            </ButtonGroup>
          </div>

          <div className="flex flex-col gap-3">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary dark:text-text-light/80">
              Статус
            </Label>
            <ButtonGroup className="flex flex-wrap gap-2">
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
      </div>

      {keywordsCount === 0 && (
        <p className="text-xs text-text-secondary dark:text-text-light/70">
          Добавьте ключевые слова, чтобы подсветить приоритетные комментарии.
        </p>
      )}
    </SectionCard>
  )
}

export default CommentsFiltersPanel
