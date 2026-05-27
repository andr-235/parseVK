import { useState } from 'react'
import type { TelegramSyncResult } from '@/types/common'
import { PageHeader } from '@/components/common'
import { Send, Users, Link, MessageSquare } from 'lucide-react'
import TelegramSessionCard from '@/components/telegram/TelegramSessionCard'
import TelegramSyncCard from '@/components/telegram/TelegramSyncCard'
import TelegramMembersCard from '@/components/telegram/TelegramMembersCard'

const PAGE_CARDS = [
  { icon: Link, title: 'Сессии', subtitle: 'Управление подключениями к API' },
  { icon: Send, title: 'Синхронизация', subtitle: 'Загрузка участников чатов' },
  { icon: Users, title: 'Участники', subtitle: 'База членов сообществ' },
  { icon: MessageSquare, title: 'Чаты', subtitle: 'Группы и каналы' },
]

function TelegramPage() {
  const [data, setData] = useState<TelegramSyncResult | null>(null)

  return (
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <PageHeader
          variant="grid"
          title={
            <>
              Telegram <span className="text-accent-info">интеграция</span>
            </>
          }
          description="Управление сессиями Telegram API для автоматической синхронизации участников чатов и групп. Получайте актуальные данные о членах сообществ."
          cards={PAGE_CARDS}
        />
      </div>

      {/* Management Cards - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            Управление подключением
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
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
            Результат синхронизации
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>

        <TelegramMembersCard data={data} />
      </div>
    </div>
  )
}

export default TelegramPage
