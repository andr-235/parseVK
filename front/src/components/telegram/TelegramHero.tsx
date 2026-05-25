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
      bgGradientClass: 'from-blue-500/20 to-purple-500/20',
      borderGradientClass: 'via-blue-400/50',
      iconBgClass: 'bg-blue-500/10',
      iconTextClass: 'text-blue-400',
    },
    {
      icon: Users,
      title: 'Участники',
      subtitle: 'База членов сообществ',
      bgGradientClass: 'from-purple-500/20 to-pink-500/20',
      borderGradientClass: 'via-purple-400/50',
      iconBgClass: 'bg-purple-500/10',
      iconTextClass: 'text-purple-400',
    },
    {
      icon: MessageSquare,
      title: 'Чаты',
      subtitle: 'Группы и каналы',
      bgGradientClass: 'from-pink-500/20 to-cyan-500/20',
      borderGradientClass: 'via-pink-400/50',
      iconBgClass: 'bg-pink-500/10',
      iconTextClass: 'text-pink-400',
    },
  ]

  return (
    <FeatureGridHero
      title={
        <>
          Telegram <span className="text-cyan-400">интеграция</span>
        </>
      }
      description="Управление сессиями Telegram API для автоматической синхронизации участников чатов и групп. Получайте актуальные данные о членах сообществ."
      cards={cards}
    />
  )
}
