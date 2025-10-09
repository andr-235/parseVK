import PageTitle from '../../../components/PageTitle'
import TotalGroupsCard from './TotalGroupsCard'
import SyncStatusCard from './SyncStatusCard'
import { cn } from '../../../lib/utils'

type GroupsHeroProps = {
  isLoading: boolean
  totalGroups: number
  hasGroups: boolean
}

function GroupsHero({ isLoading, totalGroups, hasGroups }: GroupsHeroProps) {
  return (
    <section
      className={cn(
        'grid gap-6 rounded-[26px] p-6 shadow-[0_28px_54px_-36px_rgba(52,152,219,0.45)] transition-shadow md:gap-8 md:p-8 xl:p-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]',
        'dark:shadow-[0_34px_64px_-44px_rgba(93,173,226,0.7)]',
        'border-[rgba(52,152,219,0.18)] bg-[linear-gradient(135deg,rgba(52,152,219,0.1),rgba(52,152,219,0.03))]',
        'dark:border-[rgba(93,173,226,0.25)] dark:bg-[linear-gradient(135deg,rgba(93,173,226,0.16),rgba(40,116,166,0.08))]'
      )}
    >
      <div>
        <PageTitle description="Управляйте списком сообществ: добавляйте новые источники вручную, импортируйте их из файлов и отслеживайте состояние каталога. Ниже — быстрый срез по количеству и статусу обновления данных.">
          Группы
        </PageTitle>

        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          <TotalGroupsCard isLoading={isLoading} totalGroups={totalGroups} hasGroups={hasGroups} />
          <SyncStatusCard isLoading={isLoading} hasGroups={hasGroups} />
        </div>
      </div>

    </section>
  )
}

export default GroupsHero
