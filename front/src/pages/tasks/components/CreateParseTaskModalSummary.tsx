import { CheckCircle2, RefreshCcw } from 'lucide-react'
import { cn } from '@/shared/utils'

type CreateParseTaskMode = 'recent_posts' | 'recheck_group'

interface CreateParseTaskModalSummaryProps {
  selectedCount: number
  groupsCount: number
  filteredCount: number
  mode: CreateParseTaskMode
  onModeChange: (mode: CreateParseTaskMode) => void
  onSelectAll: () => void
  onDeselectAll: () => void
}

const modeOptions: Array<{
  value: CreateParseTaskMode
  title: string
  description: string
  icon: typeof CheckCircle2
}> = [
  {
    value: 'recent_posts',
    title: 'Последние посты',
    description: 'Собрать новые публикации и комментарии по выбранным группам.',
    icon: CheckCircle2,
  },
  {
    value: 'recheck_group',
    title: 'Перепроверка',
    description: 'Обновить состояние группы и повторно пройти доступные данные.',
    icon: RefreshCcw,
  },
]

function CreateParseTaskModalSummary({
  selectedCount,
  groupsCount,
  filteredCount,
  mode,
  onModeChange,
  onSelectAll,
  onDeselectAll,
}: CreateParseTaskModalSummaryProps) {
  return (
    <aside className="space-y-4">
      <section className="rounded-card border border-border/70 bg-background-primary/50 p-4">
        <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Выбрано
        </p>
        <div className="mt-2 flex items-end gap-2">
          <span className="font-monitoring-display text-4xl font-semibold text-accent-primary">
            {selectedCount}
          </span>
          <span className="pb-1 font-monitoring-body text-sm text-text-secondary">
            из {groupsCount}
          </span>
        </div>
        <p className="mt-2 font-monitoring-body text-sm text-text-secondary">
          В текущем поиске: {filteredCount}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            className="h-9 rounded-lg border border-border/70 bg-background-secondary px-3 font-monitoring-body text-sm font-semibold text-text-primary hover:border-accent-primary/40 hover:bg-accent-primary/10 hover:text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30"
          >
            Выбрать все
          </button>
          <button
            type="button"
            onClick={onDeselectAll}
            className="h-9 rounded-lg px-3 font-monitoring-body text-sm font-semibold text-text-secondary hover:bg-background-secondary hover:text-text-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30"
          >
            Снять
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Режим задачи
        </p>
        {modeOptions.map((option) => {
          const Icon = option.icon
          const isActive = option.value === mode

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onModeChange(option.value)}
              aria-pressed={isActive}
              className={cn(
                'flex w-full items-start gap-3 rounded-card border p-3 text-left outline-none hover:border-accent-primary/40 hover:bg-background-primary/70 focus-visible:ring-2 focus-visible:ring-accent-primary/30',
                isActive
                  ? 'border-accent-primary/50 bg-accent-primary/10'
                  : 'border-border/70 bg-background-primary/40'
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
                  isActive
                    ? 'border-accent-primary/40 bg-accent-primary text-primary-foreground'
                    : 'border-border/70 bg-background-secondary text-text-secondary'
                )}
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block font-monitoring-body text-sm font-semibold text-text-light">
                  {option.title}
                </span>
                <span className="mt-1 block font-monitoring-body text-xs leading-5 text-text-secondary">
                  {option.description}
                </span>
              </span>
            </button>
          )
        })}
      </section>
    </aside>
  )
}

export default CreateParseTaskModalSummary
