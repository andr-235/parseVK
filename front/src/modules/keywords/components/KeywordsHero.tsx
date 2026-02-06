import { BookMarked, Tag, Hash } from 'lucide-react'
import { Card } from '@/shared/ui/card'

interface KeywordsHeroProps {
  totalKeywords: number
}

export const KeywordsHero = ({ totalKeywords }: KeywordsHeroProps) => {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3">
          <h1 className="font-monitoring-display text-3xl font-bold tracking-tight text-white">
            Ключевые <span className="text-cyan-400">слова</span>
          </h1>
          <p className="text-slate-300 max-w-2xl text-lg">
            Управляйте словарем для автоматического поиска совпадений в комментариях. Группируйте
            слова по категориям для более точной фильтрации.
          </p>
        </div>

        {/* Stats Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/50 px-4 py-2 text-sm backdrop-blur-sm">
            <Hash className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">Всего слов:</span>
            <span className="font-mono-accent font-semibold text-white">{totalKeywords}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Feature Card 1 */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <BookMarked className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">
                  Автопоиск
                </h3>
                <p className="text-xs text-slate-400">
                  Автоматическое выделение ключевых слов в комментариях
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Feature Card 2 */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Tag className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">
                  Категории
                </h3>
                <p className="text-xs text-slate-400">
                  Группируйте слова по темам для удобной навигации
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Feature Card 3 */}
        <div className="relative sm:col-span-2 lg:col-span-1">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Hash className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">Импорт</h3>
                <p className="text-xs text-slate-400">Массовая загрузка ключевых слов из файла</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
