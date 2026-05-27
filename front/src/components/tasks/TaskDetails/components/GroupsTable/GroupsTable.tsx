import type { TaskDetails as TaskDetailsType } from '@/types'
import { getGroupStatusText } from '@/utils/tasks/statusHelpers'
import { GroupResultCell } from './GroupResultCell'
import { groupStatusClasses } from '../../utils/formatters'

interface GroupsTableProps {
  groups: TaskDetailsType['groups']
}

export const GroupsTable = ({ groups }: GroupsTableProps) => {
  return (
    <div>
      <h3 className="font-monitoring-body text-base font-semibold text-text-primary mb-4">Группы</h3>
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-background-secondary/70">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/70 font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary">
            <tr>
              <th className="px-6 py-4 w-16">№</th>
              <th className="px-6 py-4">Название группы</th>
              <th className="px-6 py-4 w-32">Статус</th>
              <th className="px-6 py-4 w-64 text-right">Результат</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {groups.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center font-monitoring-body text-sm font-normal text-text-secondary">
                  Нет данных по группам
                </td>
              </tr>
            ) : (
              groups.map((group, index) => (
                <tr
                  key={`${group.groupId}-${index}`}
                  className="transition-colors hover:bg-muted/40"
                >
                  <td className="px-6 py-4 font-mono-accent text-xs font-medium text-text-secondary">{index + 1}</td>
                  <td
                    className="px-6 py-4 font-monitoring-body text-sm font-normal text-text-primary max-w-[300px] truncate"
                    title={group.groupName || undefined}
                  >
                    {group.groupName}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`font-monitoring-body text-xs font-semibold uppercase tracking-wider ${groupStatusClasses[group.status]}`}
                    >
                      {getGroupStatusText(group.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-end">
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
