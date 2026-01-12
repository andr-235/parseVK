import { Users, ExternalLink, Trash2 } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExpandableText } from '@/components/ExpandableText'
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

export function GroupCard({ group, onDelete }: GroupCardProps) {
  const link = `https://vk.com/${group.screenName || `club${group.vkId}`}`

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 flex items-start gap-4 border-b bg-muted/10">
        <div className="shrink-0 relative">
          {group.photo50 ? (
            <img
              src={group.photo50}
              alt={group.name}
              className="size-12 rounded-full object-cover border"
            />
          ) : (
            <div className="size-12 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xl font-semibold text-muted-foreground">
                {group.name?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1">
            {group.isClosed === 1 ? (
              <Badge variant="secondary" className="px-1 h-4 text-[10px]">
                Закр
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-base truncate" title={group.name}>
              {group.name}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">
              {GROUP_TYPE_LABELS[group.type || ''] || group.type || 'Группа'}
            </span>
            <span>•</span>
            <span>ID: {group.vkId}</span>
          </div>
        </div>
      </div>

      <CardContent className="flex-1 p-4 flex flex-col gap-3 text-sm">
        {group.status && (
          <div className="text-muted-foreground bg-muted/20 p-2 rounded-md text-xs italic">
            "{group.status}"
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="size-4" />
            <span className="text-foreground font-medium">
              {group.membersCount?.toLocaleString() ?? 0}
            </span>
            <span>участников</span>
          </div>

          {group.description && (
            <div className="text-muted-foreground text-xs mt-2">
              <ExpandableText text={group.description} maxLength={80} />
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-3 bg-muted/5 flex items-center justify-between gap-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-muted-foreground hover:text-primary"
          onClick={() => window.open(link, '_blank')}
        >
          <ExternalLink className="mr-2 size-3.5" />
          Открыть
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(group.id)}
        >
          <Trash2 className="mr-2 size-3.5" />
          Удалить
        </Button>
      </CardFooter>
    </Card>
  )
}
