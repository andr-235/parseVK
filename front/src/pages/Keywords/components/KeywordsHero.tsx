import PageHeroCard from '@/components/PageHeroCard'
import { Badge } from '@/components/ui/badge'

interface KeywordsHeroProps {
  keywordCount: number
}

function KeywordsHero({ keywordCount }: KeywordsHeroProps) {
  const hasKeywords = keywordCount > 0

  return (
    <PageHeroCard
      title="Ключевые слова"
      description="Добавляйте ключевые слова для быстрого отслеживания релевантных комментариев. Вы можете ввести слова вручную или загрузить список из файла."
      actions={
        <Badge variant="secondary" className="bg-accent-primary/10 text-accent-primary px-5 py-2 text-sm font-semibold">
          {hasKeywords ? `${keywordCount} активно` : 'Пока нет слов'}
        </Badge>
      }
    />
  )
}

export default KeywordsHero
