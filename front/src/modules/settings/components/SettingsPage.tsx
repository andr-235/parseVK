import { AutomationCard } from '@/modules/settings/components/AutomationCard'
import { TelegramCard } from '@/modules/settings/components/TelegramCard'
import { SettingsHero } from '@/modules/settings/components/SettingsHero'

function SettingsPage() {
  return (
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body">
      {/* Hero Section - fade in first */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <SettingsHero />
      </div>

      {/* Settings Cards - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            Конфигурация модулей
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <AutomationCard />
          <TelegramCard />
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
