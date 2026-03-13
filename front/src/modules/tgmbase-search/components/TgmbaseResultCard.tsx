import { EmptyState } from '@/shared/components/EmptyState'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import type { TgmbaseSearchItem } from '@/shared/types'
import { TgmbaseMessagesPanel } from './TgmbaseMessagesPanel'

interface TgmbaseResultCardProps {
  item: TgmbaseSearchItem
  selected: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
}

const getResultId = (query: string) => `tgmbase-result-${encodeURIComponent(query)}`

export function TgmbaseResultCard({
  item,
  selected,
  isLoadingMore,
  onLoadMore,
}: TgmbaseResultCardProps) {
  const renderStatusState = () => {
    if (item.status === 'not_found') {
      return (
        <EmptyState
          title="Совпадения не найдены"
          description="В tgmbase нет пользователя с таким идентификатором."
        />
      )
    }

    if (item.status === 'invalid') {
      return (
        <EmptyState
          title="Невалидный запрос"
          description="Поддерживаются только telegramId, username и телефон."
        />
      )
    }

    if (item.status === 'error') {
      return (
        <EmptyState
          title="Ошибка поиска"
          description={item.error ?? 'Не удалось обработать этот запрос.'}
        />
      )
    }

    return null
  }

  const statusState = renderStatusState()

  return (
    <Card
      id={getResultId(item.query)}
      className={`border-white/10 bg-slate-900/70 text-slate-100 ${selected ? 'ring-1 ring-cyan-400/60' : ''}`}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-lg">{item.query}</CardTitle>
          <div className="text-sm text-slate-400">
            {item.profile?.fullName ?? item.candidates[0]?.fullName ?? 'Совпадений нет'}
          </div>
        </div>
        <Badge variant="outline" className="border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
          {item.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {statusState}

        {item.profile ? (
          <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-2 xl:grid-cols-4">
            <div>telegramId: {item.profile.telegramId}</div>
            <div>username: {item.profile.username ?? '—'}</div>
            <div>phone: {item.profile.phoneNumber ?? '—'}</div>
            <div>premium: {item.profile.premium ? 'yes' : 'no'}</div>
          </div>
        ) : null}

        {item.candidates.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-white">Кандидаты</div>
            <div className="flex flex-wrap gap-2">
              {item.candidates.map((candidate) => (
                <Badge key={candidate.telegramId} variant="outline" className="text-slate-200">
                  {candidate.fullName} ({candidate.telegramId})
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {item.groups.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-white">Чаты и каналы</div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {item.groups.map((group) => (
                <div key={group.peerId} className="rounded-card border border-white/10 bg-slate-950/60 p-3 text-sm">
                  <div className="font-medium text-slate-100">{group.title}</div>
                  <div className="mt-1 text-slate-400">
                    {group.type} · {group.peerId}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {item.contacts.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-white">Активные контакты в общих peer&apos;ах</div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {item.contacts.map((contact) => (
                <div key={contact.telegramId} className="rounded-card border border-white/10 bg-slate-950/60 p-3 text-sm">
                  <div className="font-medium text-slate-100">{contact.fullName}</div>
                  <div className="mt-1 text-slate-400">
                    {contact.username ? `@${contact.username}` : contact.telegramId}
                  </div>
                  <div className="mt-1 text-slate-500">
                    Общих чатов: {contact.commonPeersCount} · Сообщений: {contact.messageCount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {item.status === 'found' ? (
          <TgmbaseMessagesPanel
            messagesPage={item.messagesPage}
            isLoadingMore={isLoadingMore}
            onLoadMore={onLoadMore}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}
