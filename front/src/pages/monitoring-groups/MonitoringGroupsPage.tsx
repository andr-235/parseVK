import { useParams } from 'react-router-dom'
import { DatabaseZap, Pencil, RefreshCw, SlidersHorizontal, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/common/EmptyState'
import { cn } from '@/utils/common'
import { useMonitoringGroupsViewModel } from '@/pages/monitoring/hooks/useMonitoringGroupsViewModel'
import { getMonitoringGroupsCountLabel } from '@/pages/monitoring/hooks/monitoringGroupsViewModel.utils'
import { PageHeader } from '@/components/common'
import { Link, List, Tag, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { MonitoringGroupStatusTone } from '@/pages/monitoring/hooks/monitoringGroupsViewModel.utils'
import type { MonitoringMessenger } from '@/types/common'

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

const STATUS_BADGE_CLASSES: Record<MonitoringGroupStatusTone, string> = {
  success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  info: 'border-sky-500/25 bg-sky-500/10 text-sky-300',
  warning: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
}

const tableSkeletonRows = Array.from({ length: 5 }, (_, index) => index)

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
    syncEnabled,
    setSyncEnabled,
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
  const hasFilters = Boolean(searchTerm.trim() || categoryFilter.trim())
  const countLabel = getMonitoringGroupsCountLabel({
    shown: groups.length,
    total: totalGroups,
    hasFilters,
  })
  const isInitialLoading = isLoading && !hasGroups
  const isRefreshing = isLoading && hasGroups

  const clearFilters = () => {
    setSearchTerm('')
    setCategoryFilter('')
  }

  const pageCards = [
    {
      icon: Users,
      title: 'Всего групп',
      subtitle: '',
      customContent: (
        <div className="space-y-1">
          <p className="text-xs text-text-secondary font-medium uppercase tracking-wide font-mono-accent">
            Всего групп
          </p>
          <p className="font-monitoring-display text-2xl font-bold text-white sm:text-3xl">
            {totalGroups}
          </p>
        </div>
      ),
    },
    { icon: Link, title: 'Chat ID', subtitle: 'Уникальный идентификатор' },
    { icon: Tag, title: 'Категории', subtitle: 'Организация по темам' },
    { icon: List, title: 'Управление', subtitle: 'Добавление и редактирование' },
  ]

  return (
    <div className="mx-auto flex w-full max-w-400 flex-col gap-8 px-4 py-6 font-monitoring-body md:px-8">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <PageHeader
          variant="grid"
          title={
            <>
              Группы <span className="text-accent-primary">{activeSource.label}</span>
            </>
          }
          description="Привяжите chat_id к названию группы и зафиксируйте категорию для быстрой навигации в потоке сообщений. Организуйте мониторинг по темам и источникам."
          actions={
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {[
                { to: `/monitoring/${activeSourceKey}`, label: 'Сообщения' },
                { to: `/monitoring/${activeSourceKey}/groups`, label: 'Группы' },
              ].map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end
                  className={({ isActive }) =>
                    cn(
                      'inline-flex h-9 items-center rounded-lg px-3 text-[11px] font-semibold uppercase tracking-wide transition-all duration-200 sm:h-10 sm:px-4 sm:text-xs',
                      isActive
                        ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/25'
                        : 'border border-border/60 bg-background-secondary text-white hover:bg-white/5 hover:border-primary/50'
                    )
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </div>
          }
          cards={pageCards}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
        <section className="space-y-4">
          <div>
            <h2 className="font-monitoring-display text-xl font-semibold text-text-primary">
              {editingId ? 'Редактирование группы' : 'Новая группа'}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Добавьте chat_id, понятное имя и категорию для быстрого поиска в мониторинге.
            </p>
          </div>

          <Card className="border border-border/70 bg-background-secondary/70 p-4 shadow-soft-sm">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="monitoring-chat-id"
                  className="text-xs font-semibold uppercase tracking-wide text-text-secondary"
                >
                  Chat ID
                </Label>
                <Input
                  id="monitoring-chat-id"
                  value={chatId}
                  onChange={(event) => setChatId(event.target.value)}
                  placeholder="Например: 1200348"
                  disabled={isSaving}
                  className="h-10 border-border/70 bg-background/60 text-text-primary placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="monitoring-group-name"
                  className="text-xs font-semibold uppercase tracking-wide text-text-secondary"
                >
                  Название
                </Label>
                <Input
                  id="monitoring-group-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Название группы"
                  disabled={isSaving}
                  className="h-10 border-border/70 bg-background/60 text-text-primary placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="monitoring-group-category"
                  className="text-xs font-semibold uppercase tracking-wide text-text-secondary"
                >
                  Категория
                </Label>
                <Input
                  id="monitoring-group-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="Новости, региональные, другое"
                  list="monitoring-group-categories"
                  disabled={isSaving}
                  className="h-10 border-border/70 bg-background/60 text-text-primary placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20"
                />
                <datalist id="monitoring-group-categories">
                  {categorySuggestions.map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={saveGroup} disabled={isSaving} className="h-10 flex-1">
                  {editingId ? 'Сохранить изменения' : 'Добавить группу'}
                </Button>
                {editingId && (
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    disabled={isSaving}
                    className="h-10"
                  >
                    Отмена
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </section>

        <section className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-monitoring-display text-xl font-semibold text-text-primary">
                Группы мониторинга
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Список источников, которые участвуют в текущем потоке мониторинга.
              </p>
            </div>
            {!isInitialLoading && (
              <Badge
                variant="outline"
                className="w-fit border-border/70 bg-background-secondary/70 font-mono-accent text-xs text-text-secondary"
              >
                {countLabel}
              </Badge>
            )}
          </div>

          <Card className="overflow-hidden border border-border/70 bg-background-secondary/70 shadow-soft-sm">
            <div className="border-b border-border/60 bg-background/45 p-3">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                  <span className="inline-flex items-center gap-2 font-mono-accent font-semibold uppercase tracking-wide">
                    <SlidersHorizontal className="size-4 text-accent-primary" />
                    Фильтры
                  </span>
                  <Badge
                    variant="outline"
                    className="border-border/70 bg-background-secondary/80 text-text-primary"
                  >
                    Источник: {activeSource.label}
                  </Badge>
                  {isRefreshing && (
                    <span className="inline-flex items-center gap-1 text-accent-info">
                      <RefreshCw className="size-3 animate-spin" />
                      Обновление
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Поиск по названию, chat_id, категории"
                    className="h-10 w-full border-border/70 bg-background/60 text-text-primary lg:w-75"
                  />
                  <Input
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    placeholder="Категория"
                    list="monitoring-group-categories"
                    className="h-10 w-full border-border/70 bg-background/60 text-text-primary placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20 lg:w-45"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-pressed={syncEnabled}
                    onClick={() => setSyncEnabled(!syncEnabled)}
                    className={cn(
                      'h-10 justify-start',
                      syncEnabled &&
                        'border-accent-primary/40 bg-accent-primary/10 text-accent-primary'
                    )}
                  >
                    <DatabaseZap className="size-4" />
                    Sync
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => reloadGroups()}
                    disabled={isLoading}
                    className="h-10"
                  >
                    <RefreshCw className={cn('size-4', isLoading && 'animate-spin')} />
                    Обновить
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-3 md:p-4">
              {isInitialLoading && (
                <div className="space-y-3" aria-busy="true" aria-live="polite">
                  {tableSkeletonRows.map((row) => (
                    <div
                      key={row}
                      className="grid gap-3 rounded-xl border border-border/50 bg-background/35 p-3 md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.8fr_96px]"
                    >
                      <Skeleton className="h-5" />
                      <Skeleton className="h-5" />
                      <Skeleton className="h-5" />
                      <Skeleton className="h-5" />
                      <Skeleton className="h-5" />
                      <Skeleton className="h-5" />
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && error && (
                <div className="rounded-xl border border-destructive/35 bg-destructive/10 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-destructive">Не удалось загрузить группы</p>
                      <p className="mt-1 text-sm text-text-secondary">{error}</p>
                    </div>
                    <Button variant="outline" onClick={() => reloadGroups()} className="h-9">
                      <RefreshCw className="size-4" />
                      Повторить
                    </Button>
                  </div>
                </div>
              )}

              {!isLoading && !error && !hasGroups && (
                <EmptyState
                  variant="custom"
                  title="Группы мониторинга не заданы"
                  description="Добавьте chat_id, название и категорию. После сохранения группа появится в списке источников для мониторинга."
                  className="border border-dashed border-border/60 bg-background/35"
                />
              )}

              {!isLoading && !error && hasGroups && !hasFilteredGroups && (
                <div className="flex min-h-55 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-background/35 p-8 text-center">
                  <p className="font-semibold text-text-primary">Фильтры не нашли группы</p>
                  <p className="max-w-105 text-sm text-text-secondary">
                    Измените поиск или категорию, чтобы вернуться к списку источников.
                  </p>
                  <Button variant="outline" onClick={clearFilters} className="h-9">
                    Сбросить фильтры
                  </Button>
                </div>
              )}

              {!isInitialLoading && !error && hasFilteredGroups && (
                <>
                  <div className="hidden overflow-hidden rounded-xl border border-border/60 md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-background/45">
                          <TableHead>Название</TableHead>
                          <TableHead>Источник</TableHead>
                          <TableHead>Chat ID</TableHead>
                          <TableHead>Категория</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead>Обновлено</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groups.map((group) => {
                          const isEditing = editingId === group.id

                          return (
                            <TableRow
                              key={group.id}
                              className={cn(
                                'border-border/50',
                                isEditing && 'bg-accent-primary/10'
                              )}
                            >
                              <TableCell className="min-w-55 font-medium text-text-primary">
                                {group.name}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="border-border/70 bg-background/60 text-text-secondary"
                                >
                                  {group.sourceLabel}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono-accent text-xs text-text-secondary">
                                {group.chatId}
                              </TableCell>
                              <TableCell className="text-sm text-text-secondary">
                                {group.categoryLabel}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'whitespace-nowrap',
                                    STATUS_BADGE_CLASSES[group.statusTone]
                                  )}
                                >
                                  {group.statusLabel}
                                </Badge>
                              </TableCell>
                              <TableCell className="whitespace-nowrap font-mono-accent text-xs text-text-secondary">
                                {group.updatedLabel}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEdit(group)}
                                    disabled={isSaving}
                                    className="h-8 text-text-secondary hover:text-text-primary"
                                  >
                                    <Pencil className="size-4" />
                                    Изменить
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteGroup(group.id)}
                                    disabled={isSaving}
                                    className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <Trash2 className="size-4" />
                                    Удалить
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="space-y-3 md:hidden">
                    {groups.map((group) => (
                      <div
                        key={group.id}
                        className={cn(
                          'rounded-xl border border-border/60 bg-background/35 p-3',
                          editingId === group.id && 'border-accent-primary/40 bg-accent-primary/10'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-text-primary">
                              {group.name}
                            </h3>
                            <p className="mt-1 font-mono-accent text-xs text-text-secondary">
                              {group.chatId}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn('shrink-0', STATUS_BADGE_CLASSES[group.statusTone])}
                          >
                            {group.statusLabel}
                          </Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-text-secondary">
                          <span>Источник: {group.sourceLabel}</span>
                          <span>Категория: {group.categoryLabel}</span>
                          <span className="col-span-2">Обновлено: {group.updatedLabel}</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(group)}
                            disabled={isSaving}
                            className="h-9 flex-1"
                          >
                            <Pencil className="size-4" />
                            Изменить
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteGroup(group.id)}
                            disabled={isSaving}
                            className="h-9 flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                            Удалить
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}

export default MonitoringGroupsPage
