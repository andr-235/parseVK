import { Download, Users, FileSpreadsheet, Activity } from 'lucide-react'
import { Card } from '@/shared/ui/card'

export const OkFriendsExportHero = () => {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-3">
        <h1 className="font-monitoring-display text-3xl font-bold tracking-tight text-white">
          Экспорт друзей <span className="text-cyan-400">Одноклассников</span>
        </h1>
        <p className="text-slate-300 max-w-2xl text-lg">
          Формируйте XLSX отчёт по методу friends.get с настраиваемыми параметрами offset и limit.
          Отслеживайте прогресс выполнения и детальные логи операций.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Export Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Download className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">
                  Экспорт
                </h3>
                <p className="text-xs text-slate-400">Загрузка XLSX файла</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Friends Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">OK API</h3>
                <p className="text-xs text-slate-400">Метод friends.get</p>
              </div>
            </div>
          </Card>
        </div>

        {/* XLSX Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">Формат</h3>
                <p className="text-xs text-slate-400">Excel таблица</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Progress Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-pink-500/20 to-cyan-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
                <Activity className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">
                  Прогресс
                </h3>
                <p className="text-xs text-slate-400">Отслеживание и логи</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
