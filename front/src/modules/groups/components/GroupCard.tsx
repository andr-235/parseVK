import { Users, ExternalLink, Trash2, Lock } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { ExpandableText } from '@/shared/components/ExpandableText'
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
    <div className="group relative">
      {/* Subtle glow on hover only */}
      <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-cyan-500/0 via-blue-500/0 to-purple-500/0 opacity-0 blur-xl transition-all duration-500 group-hover:from-cyan-500/20 group-hover:via-blue-500/20 group-hover:to-purple-500/20 group-hover:opacity-100" />

      <Card className="relative flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 group-hover:border-white/20 group-hover:shadow-lg">
        {/* Top border glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Header with avatar */}
        <div className="flex items-start gap-4 border-b border-white/5 bg-slate-800/30 p-4">
          <div className="relative shrink-0">
            {group.photo50 ? (
              <img
                src={group.photo50}
                alt={group.name}
                className="size-12 rounded-full border border-white/10 object-cover shadow-lg transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-full border border-white/10 bg-slate-800 shadow-lg">
                <span className="font-monitoring-display text-xl font-semibold text-cyan-400">
                  {group.name?.[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
            )}
            {group.isClosed === 1 && (
              <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border border-white/10 bg-slate-900 shadow-md">
                <Lock className="size-3 text-amber-400" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className="font-monitoring-display truncate text-base font-semibold text-white transition-colors duration-200 group-hover:text-cyan-400"
              title={group.name}
            >
              {group.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono-accent text-slate-400">
                {GROUP_TYPE_LABELS[group.type || ''] || group.type || 'Группа'}
              </span>
              <span className="text-slate-600">•</span>
              <span className="font-mono-accent text-slate-500">ID: {group.vkId}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <CardContent className="flex flex-1 flex-col gap-3 p-4 text-sm">
          {group.status && (
            <div className="rounded-md border border-cyan-500/20 bg-cyan-500/5 p-2.5 text-xs italic text-slate-300">
              "{group.status}"
            </div>
          )}

          <div className="space-y-2.5">
            {/* Members count with icon */}
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <Users className="size-4" />
              </div>
              <span className="font-monitoring-display text-base font-semibold text-white">
                {group.membersCount?.toLocaleString('ru-RU') ?? 0}
              </span>
              <span className="text-xs text-slate-400">участников</span>
            </div>

            {group.description && (
              <div className="text-xs text-slate-400">
                <ExpandableText text={group.description} maxLength={80} />
              </div>
            )}
          </div>
        </CardContent>

        {/* Footer actions */}
        <CardFooter className="flex items-center justify-between gap-2 border-t border-white/5 bg-slate-900/30 p-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-slate-400 transition-colors duration-200 hover:bg-white/5 hover:text-cyan-400"
            onClick={() => window.open(link, '_blank')}
          >
            <ExternalLink className="mr-1.5 size-3.5" />
            Открыть
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-slate-400 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-400"
            onClick={() => onDelete(group.id)}
          >
            <Trash2 className="mr-1.5 size-3.5" />
            Удалить
          </Button>
        </CardFooter>

        {/* Bottom accent line on hover */}
        <div className="h-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </Card>
    </div>
  )
}
