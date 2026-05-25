import type { TaskDetails as TaskDetailsType } from '@/types'
import { GroupProgressBar } from './GroupProgressBar'
import { resolveGroupProgress, clamp } from '../../utils/progressCalculations'
import { getNumberFromObject } from '../../utils/formatters'

interface GroupResultCellProps {
  group: TaskDetailsType['groups'][number]
}

export const GroupResultCell = ({ group }: GroupResultCellProps) => {
  const parsedData =
    group.parsedData && typeof group.parsedData === 'object'
      ? (group.parsedData as Record<string, unknown>)
      : null

  // Success state
  if (group.status === 'success') {
    const commentsCount = parsedData
      ? getNumberFromObject(parsedData, 'commentsCount', 'comments')
      : null
    const posts = parsedData ? getNumberFromObject(parsedData, 'postsCount', 'posts') : null

    let detail = ''
    if (commentsCount !== null && posts !== null) {
      detail = `${posts} п. / ${commentsCount} ком.`
    } else if (commentsCount !== null) {
      detail = `${commentsCount} ком.`
    } else if (posts !== null) {
      detail = `${posts} п.`
    }

    return (
      <GroupProgressBar
        tone="success"
        currentValue={1}
        totalValue={1}
        labelText="100%"
        detail={<span className="text-muted-foreground">{detail}</span>}
      />
    )
  }

  // Failed state
  if (group.status === 'failed') {
    return (
      <GroupProgressBar
        tone="danger"
        currentValue={1}
        totalValue={1}
        labelText="Ошибка"
        detail={
          <span className="text-red-400 truncate max-w-[120px]">{group.error ?? 'Сбой'}</span>
        }
      />
    )
  }

  // Pending state
  if (group.status === 'pending') {
    return <span className="text-sm text-muted-foreground">В очереди</span>
  }

  // Processing/Running state
  if (group.status === 'processing' || group.status === 'running') {
    const progressInfo = resolveGroupProgress(group, parsedData)

    if (!progressInfo) {
      return (
        <GroupProgressBar
          tone="primary"
          currentValue={0}
          totalValue={1}
          labelText="Обработка..."
          detail={<span className="text-muted-foreground">...</span>}
          indeterminate
        />
      )
    }

    let barTotal =
      progressInfo.total != null && progressInfo.total > 0
        ? progressInfo.total
        : progressInfo.percent != null
          ? 100
          : 1
    let barCurrent = 0

    if (progressInfo.total != null && progressInfo.total > 0) {
      if (progressInfo.processed != null) {
        barCurrent = clamp(progressInfo.processed, 0, progressInfo.total)
      } else if (progressInfo.percent != null) {
        barCurrent = clamp((progressInfo.percent / 100) * progressInfo.total, 0, progressInfo.total)
      }
    } else if (progressInfo.percent != null) {
      barCurrent = clamp(progressInfo.percent, 0, 100)
      barTotal = 100
    }

    const percentText =
      progressInfo.percent != null ? `${Math.round(progressInfo.percent)}%` : '...'

    const hasConcreteProgress =
      progressInfo.percent != null || progressInfo.processed != null || progressInfo.total != null

    return (
      <GroupProgressBar
        tone="primary"
        currentValue={hasConcreteProgress ? barCurrent : 0}
        totalValue={hasConcreteProgress ? barTotal : 1}
        labelText={percentText}
        detail={<span className="text-muted-foreground">Парсинг...</span>}
        indeterminate={!hasConcreteProgress}
      />
    )
  }

  return <span className="text-muted-foreground">—</span>
}
