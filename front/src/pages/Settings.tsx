import PageHeroCard from '@/components/PageHeroCard'
import { AutomationCard } from './Settings/components/AutomationCard'
import { TelegramCard } from './Settings/components/TelegramCard'
import { SettingsHero } from './Settings/components/SettingsHero'

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
