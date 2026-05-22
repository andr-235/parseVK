import { Users, Shield, Microscope, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FeatureGridHero, type HeroCardConfig } from '@/components/common/FeatureGridHero'
import { cn } from '@/utils/common'

interface AuthorsHeroProps {
  totalAuthors: number
  isRefreshing: boolean
  onRefresh: () => void
}

export const AuthorsHero = ({ totalAuthors, isRefreshing, onRefresh }: AuthorsHeroProps) => {
  const cards: HeroCardConfig[] = [
    {
      icon: Users,
      title: 'Всего авторов',
      subtitle: '',
      customContent: (
        <div className="space-y-1">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide font-mono-accent">
            Всего авторов
          </p>
          <p className="font-monitoring-display text-2xl font-bold text-white">
            {totalAuthors.toLocaleString('ru-RU')}
          </p>
        </div>
      ),
    },
    {
      icon: Shield,
      title: 'Проверка',
      subtitle: 'Управление статусами верификации',
      bgGradientClass: 'from-blue-500/20 to-purple-500/20',
      borderGradientClass: 'via-blue-400/50',
      iconBgClass: 'bg-blue-500/10',
      iconTextClass: 'text-blue-400',
    },
    {
      icon: Microscope,
      title: 'Анализ фото',
      subtitle: 'AI-анализ изображений профилей',
      bgGradientClass: 'from-purple-500/20 to-pink-500/20',
      borderGradientClass: 'via-purple-400/50',
      iconBgClass: 'bg-purple-500/10',
      iconTextClass: 'text-purple-400',
    },
    {
      icon: Users,
      title: 'Профили',
      subtitle: 'Детальная информация и активность',
      bgGradientClass: 'from-pink-500/20 to-cyan-500/20',
      borderGradientClass: 'via-pink-400/50',
      iconBgClass: 'bg-pink-500/10',
      iconTextClass: 'text-pink-400',
    },
  ]

  const actions = (
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
  )

  return (
    <FeatureGridHero
      title={
        <>
          Авторы <span className="text-cyan-400">ВКонтакте</span>
        </>
      }
      description="База авторов, собранная через парсинг и мониторинг. Управляйте статусами проверки и анализируйте профили для выявления подозрительной активности."
      cards={cards}
      actions={actions}
    />
  )
}
