import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { cn } from '../../../lib/utils'
import { CARD_HOVER_EFFECT, TEXT_MUTED_STRONG } from './styles'

type SyncStatusCardProps = {
  isLoading: boolean
  hasGroups: boolean
}

const getMessage = (isLoading: boolean, hasGroups: boolean): string => {
  if (isLoading) {
    return 'Это займёт немного времени. Мы загрузим и проверим новые записи.'
  }
  if (hasGroups) {
    return 'Последняя синхронизация прошла успешно. Новые данные отображаются в таблице.'
  }
  return 'Как только вы добавите группы, здесь появится статус их последней загрузки.'
}

function SyncStatusCard({ isLoading, hasGroups }: SyncStatusCardProps) {
  return (
    <Card className={CARD_HOVER_EFFECT}>
      <CardHeader>
        <CardTitle className={cn('text-xs font-medium uppercase tracking-[0.08em]', TEXT_MUTED_STRONG)}>
          Статус синхронизации
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge
          variant="secondary"
          className={cn(
            'min-h-10 px-5 py-2 text-sm font-semibold uppercase tracking-[0.05em]',
            isLoading
              ? 'bg-[rgba(241,196,15,0.2)] text-[#d4ac0d] dark:bg-[rgba(241,196,15,0.28)] dark:text-[#f9e79f]'
              : 'bg-[rgba(46,204,113,0.2)] text-[#1e8449] dark:bg-[rgba(46,204,113,0.28)] dark:text-[#7dcea0]'
          )}
        >
          {isLoading ? 'Обновляем данные' : 'Актуальные данные'}
        </Badge>
        <CardDescription className="text-sm leading-relaxed">{getMessage(isLoading, hasGroups)}</CardDescription>
      </CardContent>
    </Card>
  )
}

export default SyncStatusCard
