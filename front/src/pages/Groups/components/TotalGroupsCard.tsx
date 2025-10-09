import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { cn } from '../../../lib/utils'
import { CARD_HOVER_EFFECT, TEXT_MUTED_STRONG } from './styles'

type TotalGroupsCardProps = {
  isLoading: boolean
  totalGroups: number
  hasGroups: boolean
}

const getMessage = (isLoading: boolean, hasGroups: boolean): string => {
  if (isLoading) {
    return 'Получаем актуальные данные — таблица ниже обновится автоматически.'
  }
  if (hasGroups) {
    return 'Список готов к работе: управляйте сообществами и следите за их состоянием ниже.'
  }
  return 'Список пуст. Добавьте первую группу или воспользуйтесь импортом, чтобы начать анализ.'
}

function TotalGroupsCard({ isLoading, totalGroups, hasGroups }: TotalGroupsCardProps) {
  return (
    <Card
      className={cn(
        CARD_HOVER_EFFECT,
        'bg-[linear-gradient(135deg,rgba(52,152,219,0.12),rgba(52,152,219,0))] border-[rgba(52,152,219,0.28)]',
        'dark:bg-[linear-gradient(135deg,rgba(93,173,226,0.25),rgba(52,152,219,0.05))] dark:border-[rgba(93,173,226,0.35)]'
      )}
    >
      <CardHeader>
        <CardTitle className={cn('text-xs font-medium uppercase tracking-[0.08em]', TEXT_MUTED_STRONG)}>
          Всего групп
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-4xl font-bold text-[#3498db] md:text-5xl dark:text-[#5dade2]">
            {isLoading ? '—' : totalGroups}
          </span>
          {!isLoading && (
            <Badge variant="secondary" className="bg-[rgba(52,152,219,0.16)] text-[#1b4f72] dark:bg-[rgba(93,173,226,0.28)] dark:text-[rgba(236,240,241,0.9)]">
              {hasGroups ? 'Каталог активен' : 'Пока пусто'}
            </Badge>
          )}
        </div>
        <CardDescription className="text-sm leading-relaxed">{getMessage(isLoading, hasGroups)}</CardDescription>
      </CardContent>
    </Card>
  )
}

export default TotalGroupsCard
