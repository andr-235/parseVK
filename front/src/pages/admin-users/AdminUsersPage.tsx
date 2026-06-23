import { useState } from 'react'
import { PageShell } from '../../components/layout/PageShell'
import { useFeedback } from '../../shared/hooks/useFeedback'
import { AdminUsersTable } from './AdminUsersTable'
import { AdminUsersToolbar } from './AdminUsersToolbar'
import { CreateUserRow } from './CreateUserRow'
import { TemporaryPasswordBanner } from './TemporaryPasswordBanner'
import { useAdminUsers } from './useAdminUsers'

export function AdminUsersPage() {
  const users = useAdminUsers()
  const { feedback, showFeedback } = useFeedback()
  const [createExpanded, setCreateExpanded] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)

  const toggleEdit = (id: string) => {
    setEditingId((current) => current === id ? null : id)
    setCreateExpanded(false)
  }

  return (
    <PageShell title="Админ-панель">
      {temporaryPassword && <TemporaryPasswordBanner password={temporaryPassword} onClose={() => setTemporaryPassword(null)} />}
      {feedback && (
        <p className={`mb-4 rounded-md border px-3 py-2 text-xs ${feedback.type === 'success' ? 'border-success/30 text-success' : 'border-danger/30 text-danger'}`} role="status">
          {feedback.text}
        </p>
      )}
      <AdminUsersToolbar
        search={users.search}
        role={users.role}
        active={users.active}
        password={users.password}
        onSearch={users.setSearch}
        onRole={users.setRole}
        onActive={users.setActive}
        onPassword={users.setPassword}
        onReset={users.resetFilters}
      />
      <div className="rounded-lg border border-border bg-bg-main">
        <CreateUserRow
          expanded={createExpanded}
          onToggle={() => { setCreateExpanded((value) => !value); setEditingId(null) }}
          onCreated={() => { setCreateExpanded(false); showFeedback('success', 'Пользователь создан') }}
        />
        <AdminUsersTable
          data={users.data}
          loading={users.isLoading}
          error={users.error}
          editingId={editingId}
          sort={{ key: users.sortBy, dir: users.sortDir }}
          onSort={users.changeSort}
          onRetry={() => users.refetch()}
          onEdit={toggleEdit}
          onSaved={() => { setEditingId(null); showFeedback('success', 'Изменения сохранены') }}
          onPassword={setTemporaryPassword}
          onPage={users.setPage}
        />
      </div>
    </PageShell>
  )
}
