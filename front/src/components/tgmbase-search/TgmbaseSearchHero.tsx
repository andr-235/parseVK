import { Badge } from '@/components/ui/badge'

export function TgmbaseSearchHero() {
  return (
    <section className="relative overflow-hidden rounded-card border border-border/60 bg-background-secondary p-6 text-white shadow-soft-sm">
      <div className="relative space-y-4">
        <Badge className="w-fit border-cyan-500/20 bg-cyan-500/10 text-cyan-400" variant="outline">
          TGMB Search
        </Badge>
        <div className="space-y-2">
          <h1 className="font-monitoring-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Telegram Intelligence Search
          </h1>
          <p className="max-w-3xl text-sm text-slate-300 md:text-base">
            Массовый поиск по базе `tgmbase` по `telegramId`, `username` и номеру телефона.
            Результат показывает профиль, связанные чаты, активных контактов в общих peer&apos;ах и
            последние сообщения пользователя.
          </p>
        </div>
      </div>
    </section>
  )
}
