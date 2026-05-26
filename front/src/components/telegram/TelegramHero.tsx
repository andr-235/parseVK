import { Send, Users, Link, MessageSquare } from 'lucide-react'
import { FeatureGridHero, type HeroCardConfig } from '@/components/common/FeatureGridHero'

export const TelegramHero = () => {
  const cards: HeroCardConfig[] = [
    {
      icon: Link,
      title: 'Сессии',
      subtitle: 'Управление подключениями к API',
    },
    {
      icon: Send,
      title: 'Синхронизация',
      subtitle: 'Загрузка участников чатов',
      bgGradientClass: 'from-accent-primary/20 to-accent-info/20',
      borderGradientClass: 'via-accent-primary/50',
      iconBgClass: 'bg-accent-primary/10',
      iconTextClass: 'text-accent-primary',
    },
    {
      icon: Users,
      title: 'Участники',
      subtitle: 'База членов сообществ',
      bgGradientClass: 'from-accent-info/20 to-accent-primary/20',
      borderGradientClass: 'via-accent-info/50',
      iconBgClass: 'bg-accent-info/10',
      iconTextClass: 'text-accent-info',
    },
    {
      icon: MessageSquare,
      title: 'Чаты',
      subtitle: 'Группы и каналы',
      bgGradientClass: 'from-accent-primary/20 to-accent-info/20',
      borderGradientClass: 'via-accent-primary/50',
      iconBgClass: 'bg-accent-primary/10',
      iconTextClass: 'text-accent-primary',
    },
  ]

  return (
    <FeatureGridHero
      title={
        <>
          Telegram <span className="text-accent-info">интеграция</span>
        </>
      }
      description="Управление сессиями Telegram API для автоматической синхронизации участников чатов и групп. Получайте актуальные данные о членах сообществ."
      cards={cards}
    />
  )
}
