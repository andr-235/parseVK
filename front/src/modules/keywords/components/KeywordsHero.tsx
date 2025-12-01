import PageTitle from '@/components/PageTitle'

export const KeywordsHero = () => {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-1.5">
        <PageTitle>Ключевые слова</PageTitle>
        <p className="max-w-2xl text-muted-foreground">
          Управляйте словарем для поиска совпадений в комментариях. Вы можете группировать слова по
          категориям.
        </p>
      </div>
    </div>
  )
}

