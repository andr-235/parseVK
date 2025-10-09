import { cn } from '@/lib/utils'
import PageTitle from '../../../components/PageTitle'

function GroupsHero() {
  return (
    <section
      className={cn(
        'relative isolate overflow-hidden rounded-[16px] border border-sky-400/25 bg-sky-50/70 px-5 py-3 shadow-[0_24px_90px_-60px_rgba(56,152,255,0.55)] transition-shadow duration-300 md:px-5 md:py-3 lg:px-5 lg:py-3',
        'dark:border-sky-300/20 dark:bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.5),rgba(15,23,42,0.9))] dark:shadow-[0_28px_90px_-60px_rgba(93,173,226,0.55)]'
      )}
    >
      <PageTitle> Группы </PageTitle>
    </section>
  )
}

export default GroupsHero
