import PageHeroCard from '@/components/PageHeroCard'
import { AutomationCard } from '@/features/settings/ui/AutomationCard'
import { TelegramCard } from '@/features/settings/ui/TelegramCard'
import { SettingsHero } from '@/features/settings/ui/SettingsHero'

function Settings() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeroCard
        title="Настройки системы"
        description="Управление расписанием автоматического парсинга и интеграциями."
        actions={<SettingsHero />}
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <AutomationCard />
        <TelegramCard />
      </div>
    </div>
  )
}

export default Settings
