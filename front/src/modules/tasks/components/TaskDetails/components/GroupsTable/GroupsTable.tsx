import type { TaskDetails as TaskDetailsType } from '@/types'
import { getGroupStatusText } from '@/modules/tasks/utils/statusHelpers'
import { GroupResultCell } from './GroupResultCell'
import { groupStatusClasses } from '../../utils/formatters'

interface GroupsTableProps {
  groups: TaskDetailsType['groups']
}

export const GroupsTable = ({ groups }: GroupsTableProps) => {
  return (
    <div>
      <h3 className="text-lg font-bold text-foreground mb-4">Группы</h3>
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-background-secondary/70">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/70 text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                  Нет данных по группам
                </td>
              </tr>
            ) : (
              groups.map((group, index) => (
                <tr
                  key={`${group.groupId}-${index}`}
                  className="transition-colors hover:bg-muted/40"
                >
                  <td className="px-6 py-4 text-muted-foreground">{index + 1}</td>
                  <td
                    className="px-6 py-4 font-medium text-foreground max-w-[300px] truncate"
                    title={group.groupName || undefined}
                  >
                    {group.groupName}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-bold uppercase tracking-wide ${groupStatusClasses[group.status]}`}
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
