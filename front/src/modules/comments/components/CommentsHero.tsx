import PageHeroCard from '@/shared/components/PageHeroCard'
import { Badge } from '@/shared/ui/badge'

interface CommentsHeroProps {
  totalCount: number
  readCount: number
  unreadCount: number
}

function CommentsHero({ totalCount, readCount, unreadCount }: CommentsHeroProps) {
  return (
    <PageHeroCard
      title="Комментарии"
      description="Управляйте обратной связью из сообществ и отмечайте важные сообщения быстрее"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-accent-primary/10 text-accent-primary px-5 py-2 text-sm font-semibold"
          >
            {totalCount} элементов
          </Badge>
          <Badge
            variant="outline"
            className="border-accent-primary/40 text-accent-primary px-4 py-2 text-xs font-semibold"
          >
            Непрочитанные: {unreadCount}
          </Badge>
          <Badge
            variant="outline"
            className="border-border text-text-secondary px-4 py-2 text-xs font-semibold"
          >
            Прочитанные: {readCount}
          </Badge>
        </div>
      }
    />
  )
}

export default CommentsHero
