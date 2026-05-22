import { Download, Users, FileSpreadsheet, Activity } from 'lucide-react'
import { FeatureGridHero, type HeroCardConfig } from '@/components/common/FeatureGridHero'

export const OkFriendsExportHero = () => {
  const cards: HeroCardConfig[] = [
    {
      icon: Download,
      title: 'Экспорт',
      subtitle: 'Загрузка XLSX файла',
    },
    {
      icon: Users,
      title: 'OK API',
      subtitle: 'Метод friends.get',
      bgGradientClass: 'from-blue-500/20 to-purple-500/20',
      borderGradientClass: 'via-blue-400/50',
      iconBgClass: 'bg-blue-500/10',
      iconTextClass: 'text-blue-400',
    },
    {
      icon: FileSpreadsheet,
      title: 'Формат',
      subtitle: 'Excel таблица',
      bgGradientClass: 'from-purple-500/20 to-pink-500/20',
      borderGradientClass: 'via-purple-400/50',
      iconBgClass: 'bg-purple-500/10',
      iconTextClass: 'text-purple-400',
    },
    {
      icon: Activity,
      title: 'Прогресс',
      subtitle: 'Отслеживание и логи',
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
          Экспорт друзей <span className="text-cyan-400">Одноклассников</span>
        </>
      }
      description="Формируйте XLSX отчёт по методу friends.get с настраиваемыми параметрами offset и limit. Отслеживайте прогресс выполнения и детальные логи операций."
      cards={cards}
    />
  )
}
