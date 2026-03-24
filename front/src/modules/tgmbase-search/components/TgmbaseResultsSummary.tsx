import type { TgmbaseSearchStatus } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { tgmbaseStatusLabels } from './tgmbaseSearch.constants'

interface TgmbaseResultsSummaryProps {
  total: number
  summary: Record<'total' | TgmbaseSearchStatus, number>
  activeStatuses: TgmbaseSearchStatus[]
  onToggleStatus: (status: TgmbaseSearchStatus) => void
  onShowAll: () => void
}

export function TgmbaseResultsSummary({
  total,
  summary,
  activeStatuses,
  onToggleStatus,
  onShowAll,
}: TgmbaseResultsSummaryProps) {
  const statusOrder: TgmbaseSearchStatus[] = ['found', 'not_found', 'ambiguous', 'invalid', 'error']

  return (
    <Card className="border-white/10 bg-slate-900/70 text-slate-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Результаты батча</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant={activeStatuses.length === 0 ? 'default' : 'outline'}
          onClick={onShowAll}
        >
          Все {total}
        </Button>
        {statusOrder.map((status) => (
          <Button
            key={status}
            type="button"
            variant={activeStatuses.includes(status) ? 'default' : 'outline'}
            onClick={() => onToggleStatus(status)}
          >
            {tgmbaseStatusLabels[status]} {summary[status]}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
