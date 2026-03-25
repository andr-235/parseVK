import { useState } from 'react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import SectionCard from '@/shared/components/SectionCard'
import { EmptyState } from '@/shared/components/EmptyState'
import { LoadingState } from '@/shared/components/LoadingState'
import type {
  TelegramDlMatchResult,
  TelegramDlMatchRun,
} from '@/modules/telegram-dl-upload/api/telegramDlUpload.api'

interface TelegramDlMatchResultsTableProps {
  results: TelegramDlMatchResult[]
  isLoading: boolean
  activeMatchRun: TelegramDlMatchRun | null
}

type MatchFilter = 'all' | 'strict' | 'username' | 'phone'

const filterLabels: Record<MatchFilter, string> = {
  all: 'Все',
  strict: 'ID',
  username: 'Username',
  phone: 'Phone',
}

export default function TelegramDlMatchResultsTable({
  results,
  isLoading,
  activeMatchRun,
}: TelegramDlMatchResultsTableProps) {
  const [filter, setFilter] = useState<MatchFilter>('all')

  const visibleResults = results.filter((result) => {
    if (filter === 'strict') {
      return result.strictTelegramIdMatch
    }
    if (filter === 'username') {
      return result.usernameMatch
    }
    if (filter === 'phone') {
      return result.phoneMatch
    }
    return true
  })

  return (
    <SectionCard
      title="Совпадения tgmbase"
      description="Сохранённые строки результата для последнего запуска матчинга."
      className="border border-white/10 bg-slate-950/80 text-slate-100 shadow-soft-md backdrop-blur-2xl"
      headerClassName="border-white/10"
      contentClassName="space-y-4"
    >
      <div className="flex flex-wrap gap-2">
        {(Object.keys(filterLabels) as MatchFilter[]).map((mode) => (
          <Button
            key={mode}
            type="button"
            variant={filter === mode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(mode)}
          >
            {filterLabels[mode]}
          </Button>
        ))}
      </div>

      {activeMatchRun ? (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-200">
            Проверено: {activeMatchRun.contactsTotal}
          </Badge>
          <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-200">
            Совпадений: {activeMatchRun.matchesTotal}
          </Badge>
        </div>
      ) : null}

      {isLoading ? (
        <LoadingState message="Загружаю совпадения tgmbase" />
      ) : activeMatchRun?.status === 'RUNNING' ? (
        <EmptyState
          variant="custom"
          title="Матчинг выполняется"
          description="Фоновый запуск обрабатывает DL-контакты батчами. Результаты появятся после завершения."
        />
      ) : activeMatchRun?.status === 'FAILED' ? (
        <EmptyState
          variant="custom"
          title="Матчинг завершился ошибкой"
          description={activeMatchRun.error ?? 'Проверь логи backend и запусти матчинг повторно.'}
        />
      ) : visibleResults.length === 0 ? (
        <EmptyState
          variant="custom"
          title="Совпадения не найдены"
          description="Запусти матчинг или выбери другой фильтр."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>DL контакт</TableHead>
              <TableHead>tgmbase user</TableHead>
              <TableHead>Связи tgmbase</TableHead>
              <TableHead>Тип совпадения</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleResults.map((result) => (
              <TableRow key={result.id} className="border-white/10">
                <TableCell className="text-slate-200">
                  <div className="font-medium text-white">
                    {result.dlContact.fullName ??
                      [result.dlContact.firstName, result.dlContact.lastName]
                        .filter(Boolean)
                        .join(' ')}
                  </div>
                  <div className="text-xs text-slate-400">
                    telegramId: {result.dlContact.telegramId ?? '—'}
                  </div>
                  <div className="text-xs text-slate-400">{result.dlContact.originalFileName}</div>
                </TableCell>
                <TableCell className="text-slate-200">
                  <div className="font-medium text-white">
                    {result.user?.first_name ?? '—'} {result.user?.last_name ?? ''}
                  </div>
                  <div className="text-xs text-slate-400">
                    username: {result.user?.username ?? '—'}
                  </div>
                  <div className="text-xs text-slate-400">phone: {result.user?.phone ?? '—'}</div>
                </TableCell>
                <TableCell className="text-slate-200">
                  {result.user?.relatedChats?.length ? (
                    <div className="max-h-24 space-y-1 overflow-y-auto pr-2 text-xs text-slate-300">
                      {result.user.relatedChats.map((chat) => (
                        <div key={`${chat.type}:${chat.peer_id}`}>
                          {chat.type}: {chat.title} ({chat.peer_id})
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">Нет данных</div>
                  )}
                </TableCell>
                <TableCell className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {result.strictTelegramIdMatch ? (
                      <Badge className="bg-emerald-400/10 text-emerald-200">ID match</Badge>
                    ) : null}
                    {result.usernameMatch ? (
                      <Badge className="bg-cyan-400/10 text-cyan-200">Username match</Badge>
                    ) : null}
                    {result.phoneMatch ? (
                      <Badge className="bg-amber-400/10 text-amber-200">Phone match</Badge>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SectionCard>
  )
}
