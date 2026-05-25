import { NavLink } from 'react-router-dom'
import { Users, Tag, List, Link } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/utils/common'

interface MonitoringGroupsHeroProps {
  sourceName: string
  sourceKey: string
  totalGroups: number
}

const getNavButtonClasses = (isActive: boolean) =>
  cn(
    'inline-flex h-9 items-center rounded-lg px-3 text-[11px] font-semibold uppercase tracking-wide transition-all duration-200 sm:h-10 sm:px-4 sm:text-xs',
    isActive
      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
      : 'border border-white/10 bg-slate-800/50 text-white hover:bg-white/5 hover:border-cyan-400/50'
  )

export const MonitoringGroupsHero = ({
  sourceName,
  sourceKey,
  totalGroups,
}: MonitoringGroupsHeroProps) => {
  const messagesPath = `/monitoring/${sourceKey}`
  const groupsPath = `/monitoring/${sourceKey}/groups`

  return (
    <div className="flex flex-col gap-5 md:gap-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <h1 className="font-monitoring-display text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
            Группы <span className="text-cyan-400">{sourceName}</span>
          </h1>
          <p className="max-w-[68ch] text-sm leading-6 text-slate-300 sm:text-base md:text-lg">
            Привяжите chat_id к названию группы и зафиксируйте категорию для быстрой навигации в
            потоке сообщений. Организуйте мониторинг по темам и источникам.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <NavLink to={messagesPath} className={({ isActive }) => getNavButtonClasses(isActive)}>
            Сообщения
          </NavLink>
          <NavLink to={groupsPath} className={({ isActive }) => getNavButtonClasses(isActive)}>
            Группы
          </NavLink>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 xl:grid-cols-4">
        {/* Total Groups Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-50 blur-lg" />
          <Card className="relative overflow-hidden border border-white/10 bg-slate-900/80 p-4 backdrop-blur-2xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide font-mono-accent">
                  Всего групп
                </p>
                <p className="font-monitoring-display text-2xl font-bold text-white sm:text-3xl">
                  {totalGroups}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Chat ID Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-50 blur-lg" />
          <Card className="relative overflow-hidden border border-white/10 bg-slate-900/80 p-4 backdrop-blur-2xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Link className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">
                  Chat ID
                </h3>
                <p className="text-xs text-slate-400">Уникальный идентификатор</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Categories Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-50 blur-lg" />
          <Card className="relative overflow-hidden border border-white/10 bg-slate-900/80 p-4 backdrop-blur-2xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Tag className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">
                  Категории
                </h3>
                <p className="text-xs text-slate-400">Организация по темам</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Management Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-pink-500/20 to-cyan-500/20 opacity-50 blur-lg" />
          <Card className="relative overflow-hidden border border-white/10 bg-slate-900/80 p-4 backdrop-blur-2xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
                <List className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">
                  Управление
                </h3>
                <p className="text-xs text-slate-400">Добавление и редактирование</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
