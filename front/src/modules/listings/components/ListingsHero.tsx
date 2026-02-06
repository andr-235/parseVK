import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { RefreshCw, Download, Upload, Database, Filter, Archive } from 'lucide-react'
import { cn } from '@/shared/utils'

interface ListingsHeroProps {
  isListLoading: boolean
  onImport: () => void
  onExport: () => void
  onRefresh: () => void
}

export const ListingsHero = ({
  isListLoading,
  onImport,
  onExport,
  onRefresh,
}: ListingsHeroProps) => {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3">
          <h1 className="font-monitoring-display text-3xl font-bold tracking-tight text-white">
            Недвижимость
          </h1>
          <p className="text-slate-300 max-w-2xl text-lg">
            База объявлений из различных источников. Импорт, просмотр и управление статусами.
            Фильтрация по источникам и состоянию объявлений.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={onImport}
            size="lg"
            variant="outline"
            className="h-11 border-white/10 bg-slate-800/50 text-white hover:bg-white/5 hover:border-cyan-400/50 transition-all duration-200"
          >
            <Upload className="mr-2 w-5 h-5" />
            Импорт
          </Button>
          <Button
            onClick={onExport}
            size="lg"
            variant="outline"
            className="h-11 border-white/10 bg-slate-800/50 text-white hover:bg-white/5 hover:border-cyan-400/50 transition-all duration-200"
          >
            <Download className="mr-2 w-5 h-5" />
            Экспорт
          </Button>
          <Button
            onClick={onRefresh}
            size="lg"
            variant="outline"
            className="h-11 border-white/10 bg-slate-800/50 text-white hover:bg-white/5 hover:border-cyan-400/50 transition-all duration-200"
            disabled={isListLoading}
          >
            <RefreshCw className={cn('mr-2 w-5 h-5', isListLoading && 'animate-spin')} />
            Обновить
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Database Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Database className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">
                  База объявлений
                </h3>
                <p className="text-xs text-slate-400">Централизованное хранение</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Import Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Upload className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">Импорт</h3>
                <p className="text-xs text-slate-400">Загрузка из источников</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filter Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Filter className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">
                  Фильтрация
                </h3>
                <p className="text-xs text-slate-400">Поиск и сортировка</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Archive Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-pink-500/20 to-cyan-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
                <Archive className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">
                  Управление
                </h3>
                <p className="text-xs text-slate-400">Статусы и архивация</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
