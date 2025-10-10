import PageHeroCard from '@/components/PageHeroCard'
import { Badge } from '@/components/ui/badge'

interface CommentsHeroProps {
  filteredCount: number
}

function CommentsHero({ filteredCount }: CommentsHeroProps) {
  return (
    <PageHeroCard
      title="Комментарии"
      description="Управляйте обратной связью из сообществ и отмечайте важные сообщения быстрее"
      actions={
        <Badge variant="secondary" className="bg-accent-primary/10 text-accent-primary px-5 py-2 text-sm font-semibold">
          {filteredCount} элементов
        </Badge>
      }
    />
  )
}

export default CommentsHero
