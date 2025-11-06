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
      description="Коротко: добавляйте слова для отслеживания комментариев. Введите вручную или загрузите файл. Категория — по желанию."
      actions={
        <Badge variant="secondary" className="bg-accent-primary/10 text-accent-primary px-5 py-2 text-sm font-semibold">
          {hasKeywords ? `${keywordCount} активно` : 'Пока нет слов'}
        </Badge>
      }
    />
  )
}

export default KeywordsHero
