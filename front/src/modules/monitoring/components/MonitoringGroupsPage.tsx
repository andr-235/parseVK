import { useParams } from 'react-router-dom'
import { Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import SearchInput from '@/shared/components/SearchInput'
import { EmptyState } from '@/shared/components/EmptyState'
import { LoadingState } from '@/shared/components/LoadingState'
import { cn } from '@/shared/utils'
import { useMonitoringGroupsViewModel } from '@/modules/monitoring/hooks/useMonitoringGroupsViewModel'
import { MonitoringGroupsHero } from '@/modules/monitoring/components/MonitoringGroupsHero'
import type { MonitoringMessenger } from '@/shared/types'

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

function MonitoringGroupsPage() {
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

  const hasGroups = totalGroups > 0
  const hasFilteredGroups = groups.length > 0
  const hasFilters = searchTerm.trim() || categoryFilter.trim()
  const countLabel = hasFilters ? `${groups.length} из ${totalGroups}` : `${totalGroups}`

  return (
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body">
      {/* Hero Section - fade in first */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <MonitoringGroupsHero
          sourceName={activeSource.label}
          sourceKey={activeSourceKey}
          totalGroups={totalGroups}
        />
      </div>

      {/* Add/Edit Group Section - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            {editingId ? 'Редактировать группу' : 'Добавить группу'}
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        </div>

        <Card className="border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-6 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          <p className="text-sm text-slate-400 mb-4">
            Укажите chat_id, название и категорию. Запись будет обновлена, если chat_id уже есть.
          </p>
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <div className="space-y-2">
                <Label
                  htmlFor="monitoring-chat-id"
                  className="text-xs font-medium uppercase tracking-wider text-slate-400"
                >
                  Chat ID
                </Label>
                <Input
                  id="monitoring-chat-id"
                  value={chatId}
                  onChange={(event) => setChatId(event.target.value)}
                  placeholder="Например: 1200348"
                  className="h-11 border-white/10 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="monitoring-group-name"
                  className="text-xs font-medium uppercase tracking-wider text-slate-400"
                >
                  Название
                </Label>
                <Input
                  id="monitoring-group-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Название группы"
                  className="h-11 border-white/10 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="monitoring-group-category"
                  className="text-xs font-medium uppercase tracking-wider text-slate-400"
                >
                  Категория
                </Label>
                <Input
                  id="monitoring-group-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="Новостные, оппозиционные и т.д."
                  list="monitoring-group-categories"
                  className="h-11 border-white/10 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 transition-all duration-200"
                />
                <datalist id="monitoring-group-categories">
                  {categorySuggestions.map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <Button
                  onClick={saveGroup}
                  disabled={isSaving}
                  className="h-11 bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-300"
                >
                  {editingId ? 'Сохранить' : 'Добавить'}
                </Button>
                {editingId && (
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    disabled={isSaving}
                    className="h-11 border-white/10 bg-slate-800/50 text-white hover:bg-white/5 transition-all duration-200"
                  >
                    Отмена
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Groups List Section - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <h2 className="font-monitoring-display text-2xl font-semibold text-white">
              Список групп
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            {!isLoading && (
              <Badge
                variant="outline"
                className="border-white/10 bg-slate-900/50 px-3 py-1 text-xs text-slate-400 font-mono-accent"
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
              className="h-10 w-full sm:w-[240px] border-white/10 bg-slate-800/50 text-white"
            />
            <Input
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              placeholder="Категория"
              list="monitoring-group-categories"
              className="h-10 w-full sm:w-[180px] border-white/10 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 transition-all duration-200"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => reloadGroups()}
              disabled={isLoading}
              className="h-10 border-white/10 bg-slate-800/50 text-white hover:bg-white/5 transition-all duration-200"
            >
              <RefreshCw className={cn('mr-2 w-4 h-4', isLoading && 'animate-spin')} />
              Обновить
            </Button>
          </div>
        </div>

        <Card className="border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-6 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
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
        </Card>
      </div>
    </div>
  )
}

export default MonitoringGroupsPage
