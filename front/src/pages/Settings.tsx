import PageHeroCard from '@/shared/components/PageHeroCard'
import { AutomationCard } from '@/modules/settings/components/AutomationCard'
import { TelegramCard } from '@/modules/settings/components/TelegramCard'
import { SettingsHero } from '@/modules/settings/components/SettingsHero'

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
