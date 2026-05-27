import { memo } from 'react'
import { Users, ExternalLink, Trash2, Lock } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Group } from '@/types'

interface GroupCardProps {
  group: Group
  onDelete: (id: number) => void
}

const GROUP_TYPE_LABELS: Record<string, string> = {
  group: 'Группа',
  page: 'Страница',
  event: 'Событие',
}

export const GroupCard = memo(function GroupCard({ group, onDelete }: GroupCardProps) {
  const link = `https://vk.com/${group.screenName || `club${group.vkId}`}`

  return (
    <div className="group relative h-full">
      <Card className="relative flex h-full flex-col overflow-hidden rounded-card border border-border bg-background-secondary transition-all duration-300 hover:border-slate-700 hover:shadow-soft-md">
        {/* Header with avatar */}
        <div className="flex shrink-0 items-start gap-3 border-b border-border bg-background-sidebar/30 p-4">
          <div className="relative shrink-0">
            {group.photo50 ? (
              <img
                src={group.photo50}
                alt={group.name}
                className="size-12 rounded-full border border-border object-cover shadow-soft-sm transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-full border border-border bg-background-primary shadow-soft-sm">
                <span className="font-monitoring-display text-xl font-semibold text-text-secondary">
                  {group.name?.[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
            )}
            {group.isClosed === 1 && (
              <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border border-border bg-background-secondary shadow-soft-sm">
                <Lock className="size-3 text-accent-warning" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className="font-monitoring-display line-clamp-2 text-base font-semibold leading-tight text-text-light transition-colors duration-200 group-hover:text-primary"
              title={group.name}
            >
              {group.name}
            </h3>
            <div className="mt-1.5 flex items-center gap-2 text-xs">
              <span className="font-mono-accent text-text-secondary truncate">
                {GROUP_TYPE_LABELS[group.type || ''] || group.type || 'Группа'}
              </span>
              <span className="text-border">•</span>
              <span className="font-mono-accent text-text-secondary truncate">ID: {group.vkId}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden p-4 pt-5">
          {group.status && (
            <div className="shrink-0 rounded-md border border-border bg-background-primary/50 p-2.5">
              <p className="line-clamp-2 text-xs italic leading-snug text-text-secondary">
                "{group.status}"
              </p>
            </div>
          )}

          {/* Members count */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-background-sidebar text-text-secondary">
              <Users className="size-4" />
            </div>
            <span className="font-monitoring-display text-base font-semibold text-text-light">
              {group.membersCount?.toLocaleString('ru-RU') ?? 0}
            </span>
            <span className="text-xs text-text-secondary">участников</span>
          </div>

          {group.description && (
            <div className="min-h-0 flex-1 pt-1">
              <p
                className="line-clamp-3 text-xs leading-relaxed text-text-secondary"
                title={group.description}
              >
                {group.description}
              </p>
            </div>
          )}
        </CardContent>

        {/* Footer actions */}
        <CardFooter className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-background-sidebar/30 p-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 flex-1 text-text-secondary transition-colors duration-200 hover:bg-background-primary hover:text-primary"
            onClick={() => window.open(link, '_blank')}
          >
            <ExternalLink className="mr-1.5 size-3.5" />
            <span className="truncate">Открыть</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 flex-1 text-text-secondary transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(group.id)}
          >
            <Trash2 className="mr-1.5 size-3.5" />
            <span className="truncate">Удалить</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
})
