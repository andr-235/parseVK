import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import SectionCard from '@/shared/components/SectionCard'
import { EmptyState } from '@/shared/components/EmptyState'
import { LoadingState } from '@/shared/components/LoadingState'
import { telegramDlUploadQueryKeys } from '@/modules/telegram-dl-upload/api/queryKeys'
import {
  telegramDlUploadService,
  type TelegramDlMatchResult,
  type TelegramDlMatchRun,
} from '@/modules/telegram-dl-upload/api/telegramDlUpload.api'

interface TelegramDlMatchResultsTableProps {
  results: TelegramDlMatchResult[]
  isLoading: boolean
  activeMatchRun: TelegramDlMatchRun | null
}

type MatchFilter = 'all' | 'strict' | 'username' | 'phone' | 'chat'

const filterLabels: Record<MatchFilter, string> = {
  all: 'Все',
  strict: 'ID',
  username: 'Username',
  phone: 'Phone',
  chat: 'Chat',
}

interface TelegramDlMatchResultRowProps {
  result: TelegramDlMatchResult
  runId: string
  onChatExcluded: (peerId: string) => void
}

function TelegramDlMatchResultRow({
  result,
  runId,
  onChatExcluded,
}: TelegramDlMatchResultRowProps) {
  const queryClient = useQueryClient()
  const [isExpanded, setIsExpanded] = useState(false)

  const messagesQuery = useQuery({
    queryKey: telegramDlUploadQueryKeys.matchResultMessages(runId, result.id),
    queryFn: () => telegramDlUploadService.getMatchResultMessages(runId, result.id),
    enabled: isExpanded,
  })

  const excludeChatMutation = useMutation({
    mutationKey: [...telegramDlUploadQueryKeys.matchRun(runId), 'exclude-chat', result.id] as const,
    mutationFn: (peerId: string) => telegramDlUploadService.excludeChat(runId, peerId),
    onSuccess: async (updatedRun, peerId) => {
      onChatExcluded(peerId)
      queryClient.setQueryData(telegramDlUploadQueryKeys.matchRun(runId), updatedRun)
      queryClient.setQueryData<TelegramDlMatchResult[]>(
        telegramDlUploadQueryKeys.matchResults(runId),
        (current) =>
          current
            ?.map((item) => {
              const remainingChats =
                item.user?.relatedChats?.filter((chat) => chat.peer_id !== peerId) ?? []
              const nextChatActivityMatch = item.chatActivityMatch && remainingChats.length > 0

              if (
                item.id === result.id &&
                !item.strictTelegramIdMatch &&
                !item.usernameMatch &&
                !item.phoneMatch &&
                !nextChatActivityMatch
              ) {
                return null
              }

              if (item.id !== result.id) {
                return item
              }

              return {
                ...item,
                chatActivityMatch: nextChatActivityMatch,
                user: item.user
                  ? {
                      ...item.user,
                      relatedChats: remainingChats,
                    }
                  : null,
              }
            })
            .filter((item): item is TelegramDlMatchResult => item !== null) ?? []
      )
      await queryClient.invalidateQueries({
        queryKey: telegramDlUploadQueryKeys.matchRun(runId),
      })
      await queryClient.invalidateQueries({
        queryKey: telegramDlUploadQueryKeys.matchResults(runId),
      })
      await queryClient.invalidateQueries({
        queryKey: telegramDlUploadQueryKeys.matchResultMessages(runId, result.id),
      })
    },
  })

  return (
    <>
      <TableRow className="border-white/10">
        <TableCell className="text-slate-200">
          <div className="font-medium text-white">
            {result.dlContact.fullName ??
              [result.dlContact.firstName, result.dlContact.lastName].filter(Boolean).join(' ')}
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
          <div className="text-xs text-slate-400">username: {result.user?.username ?? '—'}</div>
          <div className="text-xs text-slate-400">phone: {result.user?.phone ?? '—'}</div>
        </TableCell>
        <TableCell className="text-slate-200">
          {result.user?.relatedChats?.length ? (
            <div className="space-y-2">
              <div className="max-h-24 space-y-1 overflow-y-auto pr-2 text-xs text-slate-300">
                {result.user.relatedChats.map((chat) => (
                  <div
                    key={`${chat.type}:${chat.peer_id}`}
                    className="flex items-start justify-between gap-2 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1"
                  >
                    <span>
                      {chat.type}: {chat.title} ({chat.peer_id})
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      disabled={excludeChatMutation.isPending}
                      aria-label={`Исключить чат ${chat.peer_id}`}
                      onClick={() => void excludeChatMutation.mutateAsync(chat.peer_id)}
                    >
                      Исключить
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded((current) => !current)}
              >
                {isExpanded ? 'Скрыть комментарии' : 'Комментарии'}
              </Button>
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
            {result.chatActivityMatch ? (
              <Badge className="bg-fuchsia-400/10 text-fuchsia-200">Chat activity match</Badge>
            ) : null}
          </div>
        </TableCell>
      </TableRow>

      {isExpanded ? (
        <TableRow className="border-white/10 bg-white/[0.02]">
          <TableCell colSpan={4} className="space-y-3 px-4 py-4">
            {messagesQuery.isLoading ? (
              <LoadingState message="Загружаю комментарии tgmbase" />
            ) : messagesQuery.data?.length ? (
              <div className="space-y-3">
                {messagesQuery.data.map((group) => (
                  <div
                    key={`${group.chatType}:${group.peerId}`}
                    className="rounded-xl border border-white/10 bg-slate-950/70 p-3"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <div className="text-sm font-medium text-white">
                        {group.chatType}: {group.title} ({group.peerId})
                      </div>
                      {group.isExcluded ? (
                        <Badge variant="outline" className="border-amber-400/30 text-amber-200">
                          Исключён
                        </Badge>
                      ) : null}
                    </div>
                    {group.messages.length ? (
                      <div className="max-h-72 space-y-2 overflow-y-auto pr-2">
                        {group.messages.map((message) => (
                          <div
                            key={message.messageId}
                            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300"
                          >
                            <div className="mb-1 text-[11px] text-slate-500">
                              {message.messageDate ?? 'Без даты'}
                            </div>
                            <div>{message.text ?? 'Пустое сообщение'}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">Комментарии не найдены</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                variant="custom"
                title="Комментарии не найдены"
                description="Для этого результата backend не вернул сообщений по найденным чатам."
              />
            )}
          </TableCell>
        </TableRow>
      ) : null}
    </>
  )
}

export default function TelegramDlMatchResultsTable({
  results,
  isLoading,
  activeMatchRun,
}: TelegramDlMatchResultsTableProps) {
  const [filter, setFilter] = useState<MatchFilter>('all')
  const [localResults, setLocalResults] = useState<TelegramDlMatchResult[]>(results)

  useEffect(() => {
    setLocalResults(results)
  }, [results])

  const handleChatExcluded = (peerId: string) => {
    setLocalResults((current) => {
      return current.reduce<TelegramDlMatchResult[]>((next, item) => {
        const remainingChats =
          item.user?.relatedChats?.filter((chat) => chat.peer_id !== peerId) ?? []
        const nextChatActivityMatch = item.chatActivityMatch && remainingChats.length > 0

        if (
          !item.strictTelegramIdMatch &&
          !item.usernameMatch &&
          !item.phoneMatch &&
          !nextChatActivityMatch
        ) {
          return next
        }

        next.push({
          ...item,
          chatActivityMatch: nextChatActivityMatch,
          user: item.user
            ? {
                ...item.user,
                relatedChats: remainingChats,
              }
            : null,
        })

        return next
      }, [])
    })
  }

  const visibleResults = localResults.filter((result) => {
    if (filter === 'strict') {
      return result.strictTelegramIdMatch
    }
    if (filter === 'username') {
      return result.usernameMatch
    }
    if (filter === 'phone') {
      return result.phoneMatch
    }
    if (filter === 'chat') {
      return result.chatActivityMatch
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
      ) : !activeMatchRun?.id ? (
        <EmptyState
          variant="custom"
          title="Нет активного запуска"
          description="Сначала выбери или запусти матчинг."
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
              <TelegramDlMatchResultRow
                key={result.id}
                result={result}
                runId={activeMatchRun.id}
                onChatExcluded={handleChatExcluded}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </SectionCard>
  )
}
