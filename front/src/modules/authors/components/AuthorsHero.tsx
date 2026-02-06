import { Users, Shield, Microscope, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/utils'

interface AuthorsHeroProps {
  totalAuthors: number
  isRefreshing: boolean
  onRefresh: () => void
}

export const AuthorsHero = ({ totalAuthors, isRefreshing, onRefresh }: AuthorsHeroProps) => {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3">
          <h1 className="font-monitoring-display text-3xl font-bold tracking-tight text-white">
            Авторы <span className="text-cyan-400">ВКонтакте</span>
          </h1>
          <p className="text-slate-300 max-w-2xl text-lg">
            База авторов, собранная через парсинг и мониторинг. Управляйте статусами проверки и
            анализируйте профили для выявления подозрительной активности.
          </p>
        </div>

        <Button
          onClick={onRefresh}
          size="lg"
          variant="outline"
          className="h-11 shrink-0 border-white/10 bg-slate-800/50 text-white hover:bg-white/5 hover:border-cyan-400/50 transition-all duration-200"
          disabled={isRefreshing}
        >
          <RefreshCw className={cn('mr-2 w-5 h-5', isRefreshing && 'animate-spin')} />
          Обновить
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Authors Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide font-mono-accent">
                  Всего авторов
                </p>
                <p className="font-monitoring-display text-2xl font-bold text-white">
                  {totalAuthors.toLocaleString('ru-RU')}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Feature Card 1 */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Shield className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">
                  Проверка
                </h3>
                <p className="text-xs text-slate-400">Управление статусами верификации</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Feature Card 2 */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Microscope className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">
                  Анализ фото
                </h3>
                <p className="text-xs text-slate-400">AI-анализ изображений профилей</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Feature Card 3 */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-pink-500/20 to-cyan-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">
                  Профили
                </h3>
                <p className="text-xs text-slate-400">Детальная информация и активность</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
