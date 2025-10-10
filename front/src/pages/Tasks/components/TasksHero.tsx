import PageHeroCard from '../../../components/PageHeroCard'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'

interface TasksHeroProps {
  onCreateTask: () => void
  isCreating: boolean
  areGroupsLoading: boolean
  hasGroups: boolean
  formattedLastUpdated: string
}

function TasksHero({
  onCreateTask,
  isCreating,
  areGroupsLoading,
  hasGroups,
  formattedLastUpdated,
 
}: TasksHeroProps) {
  const createButtonText = isCreating
    ? 'Запуск...'
    : areGroupsLoading
      ? 'Загрузка групп...'
      : !hasGroups
        ? 'Нет доступных групп'
        : 'Создать задачу на парсинг групп'

  const actions = (
    <>
      <Button
        onClick={onCreateTask}
        disabled={isCreating || areGroupsLoading}
        className="w-full md:w-auto"
      >
        {isCreating ? (
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
            {createButtonText}
          </span>
        ) : (
          createButtonText
        )}
      </Button>
      <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
        <Badge variant="outline" className="border-accent-primary/40 text-accent-primary">
          Автообновление 8 с
        </Badge>
        <span className="inline-flex items-center gap-2 rounded-full bg-background-primary/70 px-3 py-1 font-semibold uppercase tracking-wide">
          <span className="h-2 w-2 rounded-full bg-accent-primary" aria-hidden />
          Последнее обновление: {formattedLastUpdated}
        </span>
      </div>
    </>
  )


  return (
    <PageHeroCard
      title="Задачи парсинга"
      description="Управляйте запуском парсинга, отслеживайте прогресс задач и возвращайтесь к истории запусков, чтобы вовремя реагировать на ошибки."
      actions={actions}
    />
  )
}

export default TasksHero
