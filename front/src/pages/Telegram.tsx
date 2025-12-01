import { useState } from 'react'
import PageTitle from '@/components/PageTitle'
import TelegramSessionCard from './Telegram/components/TelegramSessionCard'
import TelegramSyncCard from './Telegram/components/TelegramSyncCard'
import TelegramMembersCard from './Telegram/components/TelegramMembersCard'
import type { TelegramSyncResponse } from '@/types/api'

const Telegram = () => {
  const [data, setData] = useState<TelegramSyncResponse | null>(null)

  return (
    <div className="flex flex-col gap-8 pb-10 pt-6">
      <div className="flex flex-col gap-1.5">
        <PageTitle>Telegram</PageTitle>
        <p className="max-w-2xl text-muted-foreground">
          Интеграция с Telegram API: управление сессиями и синхронизация участников чатов.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <TelegramSessionCard />
        <TelegramSyncCard onDataLoaded={setData} />
      </div>

      <div className="space-y-6">
        <TelegramMembersCard data={data} />
      </div>
    </div>
  )
}

export default Telegram
