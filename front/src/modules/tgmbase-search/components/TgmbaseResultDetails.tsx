import { Empty } from '@/shared/ui/empty'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import type { TgmbaseSearchItem } from '@/shared/types'
import { TgmbaseMessagesPanel } from './TgmbaseMessagesPanel'
import { tgmbaseStatusLabels } from './tgmbaseSearch.constants'

interface TgmbaseResultDetailsProps {
  item: TgmbaseSearchItem | null
  isLoadingMore: boolean
  onLoadMore: () => void
  hasActiveFilters: boolean
  onResetFilters: () => void
}

export function TgmbaseResultDetails({
  item,
  isLoadingMore,
  onLoadMore,
  hasActiveFilters,
  onResetFilters,
}: TgmbaseResultDetailsProps) {
  if (!item) {
    return (
      <Card className="border-white/10 bg-slate-900/60 text-slate-100" role="region" aria-label="Панель деталей tgmbase">
        <CardHeader>
          <h2 className="text-xl font-semibold">Детали результата</h2>
        </CardHeader>
        <CardContent>
          <Empty className="border-white/10 bg-slate-950/60 text-slate-200">
            <div className="space-y-3">
              <div className="text-lg font-semibold">Нет видимых результатов</div>
              <div className="text-sm text-slate-400">
                {hasActiveFilters
                  ? 'Снимите часть фильтров, чтобы снова увидеть записи.'
                  : 'Запустите поиск, чтобы открыть детали результата.'}
              </div>
              {hasActiveFilters ? (
                <button type="button" className="text-cyan-300 underline underline-offset-4" onClick={onResetFilters}>
                  Сбросить фильтры
                </button>
              ) : null}
            </div>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-white/10 bg-slate-900/60 text-slate-100" role="region" aria-label="Панель деталей tgmbase">
      <CardHeader className="gap-3 border-b border-white/10">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold">Детали результата</h2>
          <Badge variant="outline" className="border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
            {tgmbaseStatusLabels[item.status]}
          </Badge>
        </div>
        <div className="text-sm text-slate-400">
          Исходный запрос: {item.query} · Нормализованное значение: {item.normalizedQuery}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {item.status === 'not_found' ? (
          <div className="rounded-card border border-white/10 bg-slate-950/60 p-4 text-slate-300">
            <div className="font-semibold text-slate-100">Совпадения не найдены</div>
            <div className="mt-1 text-sm">В tgmbase нет пользователя с таким идентификатором.</div>
          </div>
        ) : null}

        {item.status === 'error' ? (
          <div className="rounded-card border border-rose-400/20 bg-rose-500/10 p-4 text-rose-100">
            <div className="font-semibold">Ошибка поиска</div>
            <div className="mt-1 text-sm">{item.error ?? 'Не удалось обработать этот запрос.'}</div>
          </div>
        ) : null}

        {item.profile ? (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Профиль</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-card border border-white/10 bg-slate-950/60 p-4">
                <div className="text-lg font-semibold text-slate-100">{item.profile.fullName}</div>
                <div className="mt-2 space-y-1 text-sm text-slate-300">
                  <div>telegramId: {item.profile.telegramId}</div>
                  <div>username: {item.profile.username ?? '—'}</div>
                  <div>phone: {item.profile.phoneNumber ?? '—'}</div>
                  <div>premium: {item.profile.premium ? 'yes' : 'no'}</div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {item.candidates.length > 0 ? (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Кандидаты</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {item.candidates.map((candidate) => (
                <div key={candidate.telegramId} className="rounded-card border border-white/10 bg-slate-950/60 p-4">
                  <div className="font-semibold text-slate-100">{candidate.fullName}</div>
                  <div className="mt-2 text-sm text-slate-300">
                    {candidate.username ? `@${candidate.username}` : candidate.telegramId}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {item.groups.length > 0 ? (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Чаты и каналы</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {item.groups.map((group) => (
                <div key={group.peerId} className="rounded-card border border-white/10 bg-slate-950/60 p-4">
                  <div className="font-semibold text-slate-100">{group.title}</div>
                  <div className="mt-2 text-sm text-slate-400">
                    {group.type} · {group.peerId}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {item.contacts.length > 0 ? (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Активные контакты</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {item.contacts.map((contact) => (
                <div key={contact.telegramId} className="rounded-card border border-white/10 bg-slate-950/60 p-4">
                  <div className="font-semibold text-slate-100">{contact.fullName}</div>
                  <div className="mt-2 text-sm text-slate-300">
                    {contact.username ? `@${contact.username}` : contact.telegramId}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Общих чатов: {contact.commonPeersCount} · Сообщений: {contact.messageCount}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {(item.status === 'found' || item.messagesPage.total > 0) && (
          <TgmbaseMessagesPanel
            messagesPage={item.messagesPage}
            isLoadingMore={isLoadingMore}
            onLoadMore={onLoadMore}
          />
        )}
      </CardContent>
    </Card>
  )
}
