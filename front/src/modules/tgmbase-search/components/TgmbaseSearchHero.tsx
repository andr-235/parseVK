import { Badge } from '@/shared/ui/badge'

export function TgmbaseSearchHero() {
  return (
    <section className="relative overflow-hidden rounded-card border border-cyan-400/20 bg-slate-950/80 p-6 text-white shadow-soft-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_40%)]" />
      <div className="relative space-y-4">
        <Badge className="w-fit border-cyan-400/30 bg-cyan-400/10 text-cyan-200" variant="outline">
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
