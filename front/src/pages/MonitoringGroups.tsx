import { NavLink, useParams } from 'react-router-dom'
import { Pencil, RefreshCw, Trash2 } from 'lucide-react'
import PageTitle from '@/shared/components/PageTitle'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import SearchInput from '@/shared/components/SearchInput'
import { EmptyState } from '@/shared/components/EmptyState'
import { LoadingState } from '@/shared/components/LoadingState'
import { cn } from '@/lib/utils'
import { useMonitoringGroupsViewModel } from '@/modules/monitoring/hooks/useMonitoringGroupsViewModel'
import type { MonitoringMessenger } from '@/types/api'

const MONITORING_SOURCES = {
  whatsapp: {
    label: 'WhatsApp',
    messenger: 'whatsapp' as MonitoringMessenger,
  },
  max: {
    label: 'Max',
    messenger: 'max' as MonitoringMessenger,
  },
} as const

const getNavButtonClasses = (isActive: boolean) =>
  cn(
    'inline-flex h-9 items-center justify-center rounded-full border px-4 text-[11px] font-semibold uppercase tracking-[0.2em] transition',
    isActive
      ? 'border-transparent bg-foreground text-background shadow-soft-sm'
      : 'border-border/60 bg-background/70 text-text-primary shadow-soft-sm backdrop-blur hover:bg-background/90'
  )

function MonitoringGroups() {
  const { sourceKey } = useParams()
  const normalizedSourceKey = sourceKey?.toLowerCase()
  const activeSource =
    normalizedSourceKey === 'max' ? MONITORING_SOURCES.max : MONITORING_SOURCES.whatsapp
  const activeSourceKey = normalizedSourceKey === 'max' ? 'max' : 'whatsapp'

  const {
    groups,
    totalGroups,
    isLoading,
    error,
    reloadGroups,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    chatId,
    setChatId,
    name,
    setName,
    category,
    setCategory,
    editingId,
    startEdit,
    saveGroup,
    resetForm,
    deleteGroup,
    categorySuggestions,
    isSaving,
  } = useMonitoringGroupsViewModel({ messenger: activeSource.messenger })

  const messagesPath = `/monitoring/${activeSourceKey}`
  const groupsPath = `/monitoring/${activeSourceKey}/groups`

  const hasGroups = totalGroups > 0
  const hasFilteredGroups = groups.length > 0
  const hasFilters = searchTerm.trim() || categoryFilter.trim()
  const countLabel = hasFilters ? `${groups.length} из ${totalGroups}` : `${totalGroups}`

  return (
    <div className="flex flex-col gap-8 pb-10 pt-6 font-monitoring-body text-text-primary">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">
            Мониторинг {activeSource.label}
          </div>
          <PageTitle className="font-monitoring-display text-3xl sm:text-4xl">
            Группы мониторинга
          </PageTitle>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Привяжите chat_id к названию группы и зафиксируйте категорию — это поможет быстрее
            ориентироваться в потоке сообщений.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <NavLink to={messagesPath} className={({ isActive }) => getNavButtonClasses(isActive)}>
            Сообщения
          </NavLink>
          <NavLink to={groupsPath} className={({ isActive }) => getNavButtonClasses(isActive)}>
            Группы
          </NavLink>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20">
          <CardTitle className="font-monitoring-display text-lg">
            {editingId ? 'Редактировать группу' : 'Добавить группу'}
          </CardTitle>
          <CardDescription>
            Укажите chat_id, название и категорию. Запись будет обновлена, если chat_id уже есть.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <div className="space-y-2">
              <Label htmlFor="monitoring-chat-id">Chat ID</Label>
              <Input
                id="monitoring-chat-id"
                value={chatId}
                onChange={(event) => setChatId(event.target.value)}
                placeholder="Например: 1200348"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monitoring-group-name">Название</Label>
              <Input
                id="monitoring-group-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Название группы"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monitoring-group-category">Категория</Label>
              <Input
                id="monitoring-group-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Новостные, оппозиционные и т.д."
                list="monitoring-group-categories"
              />
              <datalist id="monitoring-group-categories">
                {categorySuggestions.map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <Button onClick={saveGroup} className="h-10" disabled={isSaving}>
                {editingId ? 'Сохранить' : 'Добавить'}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={resetForm} className="h-10" disabled={isSaving}>
                  Отмена
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border/60 bg-muted/20 p-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Группы</h2>
            {!isLoading && (
              <Badge
                variant="outline"
                className="rounded-full border-border/60 bg-background/70 px-3 py-1 text-[11px] font-semibold shadow-soft-sm backdrop-blur"
              >
                {countLabel}
              </Badge>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Поиск по названию или chat_id"
              className="h-9 w-full sm:w-[240px]"
            />
            <Input
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              placeholder="Категория"
              className="h-9 w-full sm:w-[180px]"
              list="monitoring-group-categories"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => reloadGroups()}
              disabled={isLoading}
              className="h-9 text-muted-foreground hover:text-primary"
            >
              <RefreshCw className={`mr-2 size-4 ${isLoading ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
          </div>
        </div>

        <CardContent className="p-4 md:p-6">
          {isLoading && !hasGroups && (
            <div className="py-8">
              <LoadingState message="Загружаем группы мониторинга…" />
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
              Ошибка: {error}
            </div>
          )}

          {!isLoading && !error && !hasGroups && (
            <EmptyState
              variant="custom"
              icon="💬"
              title="Группы не заданы"
              description="Добавьте chat_id и название — список поможет быстрее ориентироваться в потоке мониторинга."
            />
          )}

          {!isLoading && !error && hasGroups && !hasFilteredGroups && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-sm text-muted-foreground">
                По запросу «{searchTerm || categoryFilter}» ничего не найдено
              </div>
            </div>
          )}

          {!isLoading && !error && hasFilteredGroups && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Chat ID</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => {
                  const isEditing = editingId === group.id
                  return (
                    <TableRow key={group.id} className={isEditing ? 'bg-muted/30' : undefined}>
                      <TableCell className="font-medium text-text-primary">
                        <div className="flex flex-col">
                          <span>{group.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {group.chatId}
                      </TableCell>
                      <TableCell>{group.category ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(group)}
                            className="h-8 text-text-primary"
                          >
                            <Pencil className="mr-2 size-4" />
                            Изменить
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteGroup(group.id)}
                            className="h-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Удалить
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default MonitoringGroups
