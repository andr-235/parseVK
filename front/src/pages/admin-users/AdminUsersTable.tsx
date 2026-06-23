import { Button } from '../../components/ui'
import { TableHead } from '../../components/widgets/table/TableHead'
import { TableShell } from '../../components/widgets/table/TableShell'
import type { AdminUsersPage, UserSortKey } from '../../shared/api/admin-users'
import { columns } from './adminUsersColumns'
import { UserRow } from './UserRow'
import { adminUsersError } from './adminUsersError'

type Props = {
  data?: AdminUsersPage
  loading: boolean
  error: Error | null
  editingId: string | null
  sort: { key: UserSortKey; dir: 'asc' | 'desc' }
  onSort: (key: string) => void
  onRetry: () => void
  onEdit: (id: string) => void
  onSaved: () => void
  onPassword: (password: string) => void
  onPage: (page: number) => void
}

export function AdminUsersTable(props: Props) {
  const items = props.data?.items ?? []
  return (
    <>
      <TableShell ariaLabel="Таблица пользователей">
        <TableHead columns={columns} sort={props.sort} onSort={props.onSort} />
        <tbody>
          {props.loading ? (
            <tr><td colSpan={6} className="px-3 py-12 text-center text-text-muted">Загрузка...</td></tr>
          ) : props.error ? (
            <tr><td colSpan={6} className="px-3 py-12 text-center text-danger">
              <p>{adminUsersError(props.error)}</p>
              <Button size="xs" onClick={props.onRetry}>Повторить</Button>
            </td></tr>
          ) : items.length === 0 ? (
            <tr><td colSpan={6} className="px-3 py-12 text-center text-text-muted">Нет пользователей</td></tr>
          ) : items.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              editing={props.editingId === user.id}
              canEdit={!props.editingId || props.editingId === user.id}
              onEdit={() => props.onEdit(user.id)}
              onSaved={props.onSaved}
              onPassword={props.onPassword}
            />
          ))}
        </tbody>
      </TableShell>
      {props.data && props.data.totalPages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-sm">
          <Button size="xs" disabled={props.data.page <= 1} onClick={() => props.onPage(props.data!.page - 1)}>Назад</Button>
          <span>{props.data.page} / {props.data.totalPages}</span>
          <Button size="xs" disabled={props.data.page >= props.data.totalPages} onClick={() => props.onPage(props.data!.page + 1)}>Вперёд</Button>
        </div>
      )}
    </>
  )
}
