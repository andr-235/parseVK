import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import type { TgmbaseMessagesPage } from '@/shared/types'

interface TgmbaseMessagesPanelProps {
  messagesPage: TgmbaseMessagesPage
  isLoadingMore: boolean
  onLoadMore: () => void
}

export function TgmbaseMessagesPanel({
  messagesPage,
  isLoadingMore,
  onLoadMore,
}: TgmbaseMessagesPanelProps) {
  return (
    <Card className="border-white/10 bg-slate-950/50 text-slate-100">
      <CardHeader>
        <CardTitle>
          Последние сообщения ({messagesPage.items.length} из {messagesPage.total})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {messagesPage.items.length === 0 ? (
          <div className="text-sm text-slate-400">Сообщения не найдены.</div>
        ) : (
          messagesPage.items.map((message) => (
            <div
              key={message.id}
              className="rounded-card border border-white/10 bg-slate-900/80 p-3"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>{new Date(message.date).toLocaleString('ru-RU')}</span>
                <span>peer: {message.peerTitle ?? message.peerId}</span>
                <span>{message.peerType}</span>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-6 text-slate-200">
                {message.text ?? 'Сообщение без текста'}
              </div>
            </div>
          ))
        )}
        {messagesPage.hasMore ? (
          <Button type="button" variant="outline" onClick={onLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Загружаю...' : 'Показать ещё сообщения'}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
