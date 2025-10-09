import PageTitle from '../../../components/PageTitle'
import TotalGroupsCard from './TotalGroupsCard'
import SyncStatusCard from './SyncStatusCard'
import { cn } from '../../../lib/utils'

type GroupsHeroProps = {
  isLoading: boolean
  totalGroups: number
  hasGroups: boolean
}

function GroupsHero({ isLoading, totalGroups, hasGroups }: GroupsHeroProps) {
  return (
    <section
      className={cn(
        'relative isolate overflow-hidden rounded-[32px] border border-sky-400/30 bg-sky-50/70 p-8 shadow-[0_36px_120px_-60px_rgba(56,152,255,0.65)] transition-shadow duration-300 md:p-10 lg:p-12',
        'dark:border-sky-300/25 dark:bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.55),rgba(15,23,42,0.85))] dark:shadow-[0_42px_120px_-64px_rgba(93,173,226,0.6)]'
      )}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-80">
        <div className="absolute -left-24 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-sky-200 blur-3xl dark:bg-sky-500/40" />
        <div className="absolute right-[-32px] top-[-60px] h-80 w-80 rounded-full bg-cyan-200/70 blur-3xl dark:bg-cyan-500/35" />
        <div className="absolute bottom-[-120px] right-1/3 h-72 w-72 rounded-full bg-indigo-200/60 blur-[120px] dark:bg-indigo-500/40" />
      </div>

      <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-8">
          <div className="inline-flex items-center gap-3 self-start rounded-full border border-sky-400/40 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 shadow-sm backdrop-blur md:text-sm dark:border-white/10 dark:bg-white/5 dark:text-sky-200">
            <span className="inline-flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-400" />
            Каталог сообществ
          </div>

          <PageTitle description="Управляйте списком сообществ: добавляйте новые источники вручную, импортируйте их из файлов и отслеживайте состояние каталога. Ниже — быстрый срез по количеству и статусу обновления данных.">
            Группы
          </PageTitle>

          <ul className="grid gap-4 text-sm text-text-secondary sm:grid-cols-2">
            <li className="flex items-start gap-3 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-sky-500 dark:bg-sky-300" />
              <span>Следите за динамикой сообществ и оперативно реагируйте на изменения аудиторий.</span>
            </li>
            <li className="flex items-start gap-3 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-300" />
              <span>Используйте актуальный статус синхронизации, чтобы поддерживать каталог в порядке.</span>
            </li>
          </ul>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
          <TotalGroupsCard isLoading={isLoading} totalGroups={totalGroups} hasGroups={hasGroups} />
          <SyncStatusCard isLoading={isLoading} hasGroups={hasGroups} />
        </div>
      </div>
    </section>
  )
}

export default GroupsHero
