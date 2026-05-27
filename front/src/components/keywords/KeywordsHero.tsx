import { BookMarked, Tag, Hash } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface KeywordsHeroProps {
  totalKeywords: number
}

export const KeywordsHero = ({ totalKeywords }: KeywordsHeroProps) => {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3">
          <h1 className="font-monitoring-display text-3xl font-bold tracking-tight text-white">
            Ключевые <span className="text-primary">слова</span>
          </h1>
          <p className="text-slate-300 max-w-2xl text-lg">
            Управляйте словарем для автоматического поиска совпадений в комментариях. Группируйте
            слова по категориям для более точной фильтрации.
          </p>
        </div>

        {/* Stats Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background-secondary px-4 py-2 text-sm shadow-soft-sm">
            <Hash className="w-4 h-4 text-primary" />
            <span className="text-slate-400">Всего слов:</span>
            <span className="font-mono-accent font-semibold text-white">{totalKeywords}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Feature Card 1 */}
        <div className="relative">
          <Card className="relative border border-border/60 bg-background-secondary shadow-soft-sm p-5 overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
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
          <Card className="relative border border-border/60 bg-background-secondary shadow-soft-sm p-5 overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
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
          <Card className="relative border border-border/60 bg-background-secondary shadow-soft-sm p-5 overflow-hidden">
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
