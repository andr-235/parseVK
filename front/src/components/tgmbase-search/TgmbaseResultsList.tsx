import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/utils/common'
import type { TgmbaseSearchItem } from '@/types/common'
import { tgmbaseQueryTypeLabels, tgmbaseStatusLabels } from './tgmbaseSearch.constants'

interface TgmbaseResultsListProps {
  items: TgmbaseSearchItem[]
  selectedQuery: string | null
  onSelect: (query: string) => void
  onMoveSelection: (direction: 'next' | 'previous') => void
}

const getPrimaryLabel = (item: TgmbaseSearchItem) =>
  item.profile?.fullName ?? item.candidates[0]?.fullName ?? 'Без профиля'

export function TgmbaseResultsList({
  items,
  selectedQuery,
  onSelect,
  onMoveSelection,
}: TgmbaseResultsListProps) {
  return (
    <Card className="border-white/10 bg-slate-900/60 text-slate-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Список результатов</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        <div
          role="list"
          aria-label="Результаты поиска tgmbase"
          className="space-y-2"
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              onMoveSelection('next')
            }

            if (event.key === 'ArrowUp') {
              event.preventDefault()
              onMoveSelection('previous')
            }
          }}
        >
          {items.map((item) => {
            const selected = selectedQuery === item.query

            return (
              <div key={`${item.query}-${item.normalizedQuery}`} role="listitem">
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelect(item.query)}
                  className={cn(
                    'w-full rounded-card border px-4 py-3 text-left transition',
                    selected
                      ? 'border-primary/60 bg-primary/10'
                      : 'border-white/10 bg-slate-950/60 hover:border-primary/30 hover:bg-slate-950'
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-100">{item.query}</span>
                        <Badge variant="outline" className="text-slate-200">
                          {tgmbaseQueryTypeLabels[item.queryType]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-primary/30 bg-primary/10 text-orange-200"
                        >
                          {tgmbaseStatusLabels[item.status]}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-300">{getPrimaryLabel(item)}</div>
                    </div>
                    <div className="flex gap-3 text-xs text-slate-400">
                      <span>Чаты {item.stats.groups}</span>
                      <span>Контакты {item.stats.contacts}</span>
                      <span>Сообщения {item.stats.messages}</span>
                    </div>
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
