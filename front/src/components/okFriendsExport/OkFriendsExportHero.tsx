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
      bgGradientClass: 'from-accent-primary/20 to-accent-info/20',
      borderGradientClass: 'via-accent-primary/50',
      iconBgClass: 'bg-accent-primary/10',
      iconTextClass: 'text-accent-primary',
    },
    {
      icon: FileSpreadsheet,
      title: 'Формат',
      subtitle: 'Excel таблица',
      bgGradientClass: 'from-accent-info/20 to-accent-primary/20',
      borderGradientClass: 'via-accent-info/50',
      iconBgClass: 'bg-accent-info/10',
      iconTextClass: 'text-accent-info',
    },
    {
      icon: Activity,
      title: 'Прогресс',
      subtitle: 'Отслеживание и логи',
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
          Экспорт друзей <span className="text-accent-info">Одноклассников</span>
        </>
      }
      description="Формируйте XLSX отчёт по методу friends.get с настраиваемыми параметрами offset и limit. Отслеживайте прогресс выполнения и детальные логи операций."
      cards={cards}
    />
  )
}
