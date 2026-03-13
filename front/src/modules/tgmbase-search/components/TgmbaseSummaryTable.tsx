import { Badge } from '@/shared/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import type { TgmbaseSearchItem } from '@/shared/types'

interface TgmbaseSummaryTableProps {
  items: TgmbaseSearchItem[]
  selectedQuery: string | null
  onSelect: (query: string) => void
}

const statusLabels: Record<TgmbaseSearchItem['status'], string> = {
  found: 'Найдено',
  not_found: 'Не найдено',
  ambiguous: 'Несколько',
  invalid: 'Невалидный',
  error: 'Ошибка',
}

const getResultId = (query: string) => `tgmbase-result-${encodeURIComponent(query)}`

export function TgmbaseSummaryTable({ items, selectedQuery, onSelect }: TgmbaseSummaryTableProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="rounded-card border border-white/10 bg-slate-900/60 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-monitoring-display text-xl font-semibold text-white">
          Сводка по батчу
        </h2>
        <div className="text-sm text-slate-400">Результатов: {items.length}</div>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead>Запрос</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Профиль</TableHead>
            <TableHead>Чаты</TableHead>
            <TableHead>Контакты</TableHead>
            <TableHead>Сообщения</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={`${item.query}-${item.normalizedQuery}`}
              className="cursor-pointer border-white/10"
              data-state={selectedQuery === item.query ? 'selected' : undefined}
              onClick={() => {
                onSelect(item.query)
                document
                  .getElementById(getResultId(item.query))
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              <TableCell className="font-medium text-slate-100">{item.query}</TableCell>
              <TableCell className="text-slate-300">{item.queryType}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className="border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                >
                  {statusLabels[item.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-300">
                {item.profile?.fullName ?? item.candidates[0]?.fullName ?? '—'}
              </TableCell>
              <TableCell className="text-slate-300">{item.stats.groups}</TableCell>
              <TableCell className="text-slate-300">{item.stats.contacts}</TableCell>
              <TableCell className="text-slate-300">{item.stats.messages}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
