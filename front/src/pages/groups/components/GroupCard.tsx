import { memo, useState, useCallback, useEffect, useRef } from 'react'
import { ExternalLink, Trash2, Users, Lock, AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import type { Group } from '@/shared/types'

const GROUP_TYPE_LABELS: Record<string, string> = {
  group: 'Группа',
  page: 'Страница',
  event: 'Событие',
}

interface GroupCardProps {
  group: Group
  onDelete: (id: number) => void
}

export const GroupCard = memo(function GroupCard({ group, onDelete }: GroupCardProps) {
  const link = `https://vk.com/${group.screenName || `club${group.vkId}`}`
  const membersLabel = group.membersCount?.toLocaleString('ru-RU') ?? '0'
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleDeleteClick = useCallback(() => {
    if (confirmingDelete) {
      onDelete(group.id)
      setConfirmingDelete(false)
      if (confirmTimer.current) clearTimeout(confirmTimer.current)
    } else {
      setConfirmingDelete(true)
      confirmTimer.current = setTimeout(() => setConfirmingDelete(false), 3000)
    }
  }, [confirmingDelete, onDelete, group.id])

  useEffect(() => () => { if (confirmTimer.current) clearTimeout(confirmTimer.current) }, [])

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-card border border-border/60 bg-background-secondary shadow-soft-sm transition-colors duration-200 hover:border-border hover:shadow-soft-md">
      <div className="flex items-start gap-3.5 p-4 pb-3">
        <div className="relative shrink-0">
          {group.photo50 ? (
            <img
              src={group.photo50}
              alt={group.name}
              loading="lazy"
              className="size-11 rounded-full border border-border/50 object-cover"
            />
          ) : (
            <div className="flex size-11 items-center justify-center rounded-full border border-border/50 bg-accent-primary/10">
              <span className="text-sm font-semibold text-accent-primary">
                {group.name?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
          )}
          {group.isClosed === 1 && (
            <div className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border border-border bg-background-secondary">
              <Lock className="size-2.5 text-accent-warning" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className="truncate text-sm font-semibold text-text-light transition-colors duration-150 group-hover:text-accent-primary"
            title={group.name}
          >
            {group.name}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
            <span>{GROUP_TYPE_LABELS[group.type || ''] || group.type || 'Группа'}</span>
            <span className="text-border/60">&middot;</span>
            <span className="font-mono-accent">ID: {group.vkId}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-4 pb-2.5">
        <Users className="size-3.5 text-text-secondary" />
        <span className="text-sm font-semibold text-text-light">{membersLabel}</span>
        <span className="text-xs text-text-secondary">участников</span>
      </div>

      {group.description && (
        <p
          className="line-clamp-2 px-4 pb-3 text-xs leading-relaxed text-text-secondary"
          title={group.description}
        >
          {group.description}
        </p>
      )}

      <div className="mt-auto flex items-center gap-2 border-t border-border/40 p-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 flex-1 text-xs text-text-secondary hover:bg-background-primary hover:text-accent-primary"
          onClick={() => window.open(link, '_blank')}
          aria-label="Открыть в новом окне"
        >
          <ExternalLink className="mr-1.5 size-3.5" />
          Открыть
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`h-9 flex-1 text-xs transition-colors ${
            confirmingDelete
              ? 'bg-destructive/15 text-accent-danger hover:bg-destructive/25'
              : 'text-text-secondary hover:bg-destructive/10 hover:text-accent-danger'
          }`}
          onClick={handleDeleteClick}
          aria-label={confirmingDelete ? 'Подтвердите удаление' : 'Удалить группу'}
        >
          {confirmingDelete ? (
            <AlertTriangle className="mr-1.5 size-3.5" />
          ) : (
            <Trash2 className="mr-1.5 size-3.5" />
          )}
          {confirmingDelete ? 'Удалить?' : 'Удалить'}
        </Button>
      </div>
    </div>
  )
})
