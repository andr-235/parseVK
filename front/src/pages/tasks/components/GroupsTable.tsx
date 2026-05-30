import type { ReactNode } from 'react'
import type { TaskDetails as TaskDetailsType } from '@/shared/types'
import ProgressBar from '@/shared/components/common/ProgressBar'
import { getGroupStatusText, GROUP_STATUS_CLASSES } from '@/pages/tasks/utils/statusHelpers'
import { clamp, getNumberFromObject, resolveGroupProgress } from '@/pages/tasks/utils/taskDetailsHelpers'

interface GroupProgressBarProps {
  tone: 'primary' | 'success' | 'warning' | 'danger'
  currentValue: number
  totalValue: number
  labelText: string
  detail: ReactNode
  indeterminate?: boolean
}

const GroupProgressBar = ({
  tone, currentValue, totalValue, labelText, detail, indeterminate = false,
}: GroupProgressBarProps) => {
  const safeTotal = totalValue > 0 ? totalValue : 1
  const safeCurrent = clamp(currentValue, 0, safeTotal)

  return (
    <div className="w-full max-w-48 space-y-1">
      <ProgressBar
        current={indeterminate ? 1 : safeCurrent}
        total={indeterminate ? 1 : safeTotal}
        size="small"
        tone={tone}
        showLabel={false}
        indeterminate={indeterminate}
        className="h-1.5"
      />
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-text-primary">{labelText}</span>
        {detail}
      </div>
    </div>
  )
}

interface GroupResultCellProps {
  group: TaskDetailsType['groups'][number]
}

const GroupResultCell = ({ group }: GroupResultCellProps) => {
  const parsedData =
    group.parsedData && typeof group.parsedData === 'object'
      ? (group.parsedData as Record<string, unknown>)
      : null

  if (group.status === 'success') {
    const commentsCount = parsedData ? getNumberFromObject(parsedData, 'commentsCount', 'comments') : null
    const posts = parsedData ? getNumberFromObject(parsedData, 'postsCount', 'posts') : null

    let detail = ''
    if (commentsCount !== null && posts !== null) detail = `${posts} п. / ${commentsCount} ком.`
    else if (commentsCount !== null) detail = `${commentsCount} ком.`
    else if (posts !== null) detail = `${posts} п.`

    return (
      <GroupProgressBar tone="success" currentValue={1} totalValue={1} labelText="100%"
        detail={<span className="text-text-secondary">{detail}</span>}
      />
    )
  }

  if (group.status === 'failed') {
    return (
      <GroupProgressBar tone="danger" currentValue={1} totalValue={1} labelText="Ошибка"
        detail={<span className="text-accent-danger truncate max-w-24">{group.error ?? 'Сбой'}</span>}
      />
    )
  }

  if (group.status === 'pending') {
    return <span className="text-sm text-text-secondary">В очереди</span>
  }

  if (group.status === 'processing' || group.status === 'running') {
    const progressInfo = resolveGroupProgress(group, parsedData)

    if (!progressInfo) {
      return (
        <GroupProgressBar tone="primary" currentValue={0} totalValue={1} labelText="Обработка..."
          detail={<span className="text-text-secondary">...</span>} indeterminate
        />
      )
    }

    let barTotal = progressInfo.total != null && progressInfo.total > 0
      ? progressInfo.total : progressInfo.percent != null ? 100 : 1
    let barCurrent = 0

    if (progressInfo.total != null && progressInfo.total > 0) {
      if (progressInfo.processed != null) barCurrent = clamp(progressInfo.processed, 0, progressInfo.total)
      else if (progressInfo.percent != null) barCurrent = clamp((progressInfo.percent / 100) * progressInfo.total, 0, progressInfo.total)
    } else if (progressInfo.percent != null) {
      barCurrent = clamp(progressInfo.percent, 0, 100)
      barTotal = 100
    }

    const percentText = progressInfo.percent != null ? `${Math.round(progressInfo.percent)}%` : '...'
    const hasConcreteProgress = progressInfo.percent != null || progressInfo.processed != null || progressInfo.total != null

    return (
      <GroupProgressBar tone="primary" currentValue={hasConcreteProgress ? barCurrent : 0}
        totalValue={hasConcreteProgress ? barTotal : 1} labelText={percentText}
        detail={<span className="text-text-secondary">Парсинг...</span>}
        indeterminate={!hasConcreteProgress}
      />
    )
  }

  return <span className="text-text-secondary">—</span>
}

interface GroupsTableProps {
  groups: TaskDetailsType['groups']
}

export const GroupsTable = ({ groups }: GroupsTableProps) => {
  return (
    <div>
      <h3 className="font-monitoring-body text-sm font-semibold text-text-primary mb-3">Группы</h3>
      <div className="overflow-hidden rounded-xl border border-border/50 bg-background-primary/50">
        <table className="w-full text-left text-sm">
          <thead className="bg-background-primary/70 font-monitoring-body text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
            <tr>
              <th className="px-4 py-3 w-12">№</th>
              <th className="px-4 py-3">Название группы</th>
              <th className="px-4 py-3 w-28">Статус</th>
              <th className="px-4 py-3 w-56 text-right">Результат</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {groups.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center font-monitoring-body text-sm font-normal text-text-secondary">
                  Нет данных по группам
                </td>
              </tr>
            ) : (
              groups.map((group, index) => (
                <tr key={`${group.groupId}-${index}`} className="transition-colors hover:bg-background-primary/40">
                  <td className="px-4 py-3 font-mono-accent text-xs font-medium text-text-secondary">{index + 1}</td>
                  <td className="px-4 py-3 font-monitoring-body text-sm font-normal text-text-primary max-w-60 truncate"
                    title={group.groupName || undefined}
                  >
                    {group.groupName}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-monitoring-body text-xs font-semibold uppercase tracking-wider ${GROUP_STATUS_CLASSES[group.status]}`}>
                      {getGroupStatusText(group.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex justify-end">
                    <GroupResultCell group={group} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
