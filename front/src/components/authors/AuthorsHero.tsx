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
          <p className="text-xs text-text-secondary font-medium uppercase tracking-wide font-mono-accent">
            Всего авторов
          </p>
          <p className="font-monitoring-display text-2xl font-bold text-text-light">
            {totalAuthors.toLocaleString('ru-RU')}
          </p>
        </div>
      ),
    },
    {
      icon: Shield,
      title: 'Проверка',
      subtitle: 'Управление статусами верификации',
      bgGradientClass: 'from-accent-primary/20 to-accent-info/20',
      borderGradientClass: 'via-accent-primary/50',
      iconBgClass: 'bg-accent-primary/10',
      iconTextClass: 'text-accent-primary',
    },
    {
      icon: Microscope,
      title: 'Анализ фото',
      subtitle: 'AI-анализ изображений профилей',
      bgGradientClass: 'from-accent-info/20 to-accent-primary/20',
      borderGradientClass: 'via-accent-info/50',
      iconBgClass: 'bg-accent-info/10',
      iconTextClass: 'text-accent-info',
    },
    {
      icon: Users,
      title: 'Профили',
      subtitle: 'Детальная информация и активность',
      bgGradientClass: 'from-accent-primary/20 to-accent-info/20',
      borderGradientClass: 'via-accent-primary/50',
      iconBgClass: 'bg-accent-primary/10',
      iconTextClass: 'text-accent-primary',
    },
  ]

  const actions = (
    <Button
      onClick={onRefresh}
      size="lg"
      variant="outline"
      className="h-11 shrink-0 border-border bg-background-secondary text-text-primary hover:bg-background-primary hover:border-accent-primary/50 transition-all duration-200"
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
          Авторы <span className="text-accent-primary">ВКонтакте</span>
        </>
      }
      description="База авторов, собранная через парсинг и мониторинг. Управляйте статусами проверки и анализируйте профили для выявления подозрительной активности."
      cards={cards}
      actions={actions}
    />
  )
}
