import { useState } from 'react'
import type { TelegramSyncResponse } from '@/shared/types'
import { TelegramHero } from '@/modules/telegram/components/TelegramHero'
import TelegramSessionCard from '@/modules/telegram/components/TelegramSessionCard'
import TelegramSyncCard from '@/modules/telegram/components/TelegramSyncCard'
import TelegramMembersCard from '@/modules/telegram/components/TelegramMembersCard'

function TelegramPage() {
  const [data, setData] = useState<TelegramSyncResponse | null>(null)

  return (
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body">
      {/* Hero Section - fade in first */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <TelegramHero />
      </div>

      {/* Management Cards - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            Управление подключением
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <TelegramSessionCard />
          <TelegramSyncCard onDataLoaded={setData} />
        </div>
      </div>

      {/* Members Section - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            Участники чатов
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        </div>

        <TelegramMembersCard data={data} />
      </div>
    </div>
  )
}

export default TelegramPage
