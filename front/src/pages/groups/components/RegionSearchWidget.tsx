import { useState, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Check, MapPin, Loader2, Building2, X } from 'lucide-react'
import { Button } from '../../../components/ui'
import { TableShell } from '../../../components/widgets/table/TableShell'
import { TableHead } from '../../../components/widgets/table/TableHead'
import { searchGroupsRegion, saveGroup } from '../../../shared/api/groups'
import type { RegionGroup } from '../../../shared/api/groups'
import type { Column } from '../../../components/widgets/table/constants'

type Props = {
  onGroupSaved: () => void
}

const columns: Column[] = [
  { key: 'avatar', label: '', className: 'w-10', sortable: false },
  { key: 'name', label: 'Название', sortable: false },
  { key: 'membersCount', label: 'Участники', className: 'w-24', sortable: false },
  { key: 'city', label: 'Город', className: 'w-32', sortable: false },
  { key: 'status', label: 'Статус', className: 'w-24', sortable: false },
  { key: 'actions', label: '', className: 'w-20', sortable: false },
]

export function RegionSearchWidget({ onGroupSaved }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())
  const [hasSearched, setHasSearched] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['region-search'],
    queryFn: () => searchGroupsRegion(),
    enabled: false,
  })

  const saveMutation = useMutation({
    mutationFn: (id: number) => saveGroup(String(id)),
    onSuccess: (_data, id) => {
      setSavedIds((prev) => new Set(prev).add(id))
      onGroupSaved()
    },
  })

  const handleToggle = useCallback(() => {
    if (!isOpen) {
      setIsOpen(true)
      setHasSearched(true)
      refetch()
    } else {
      setIsOpen(false)
    }
  }, [isOpen, refetch])

  const handleRetry = useCallback(() => {
    refetch()
  }, [refetch])

  const handleSave = useCallback((id: number) => {
    saveMutation.mutate(id)
  }, [saveMutation])

  const handleSaveAll = useCallback(() => {
    if (!data?.missing) return
    data.missing.forEach((g) => {
      if (!savedIds.has(g.vkId)) {
        saveMutation.mutate(g.vkId)
      }
    })
  }, [data, savedIds, saveMutation])

  const results = data?.groups ?? []
  const unsavedMissing = data?.missing.filter((g) => !savedIds.has(g.vkId)) ?? []

  return (
    <div className="mb-4">
      <Button
        variant="secondary" size="xs"
        onClick={handleToggle}
        icon={<MapPin size={14} />}
      >
        {isOpen ? 'Скрыть' : 'Поиск по региону'}
      </Button>

      {isOpen && (
        <div className="mt-3 rounded-md border border-border bg-bg-panel p-4">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-text-muted">
              <Loader2 size={14} className="animate-spin" />
              Поиск групп в Еврейской АО...
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center gap-2 py-4 text-xs text-danger">
              <p>{error instanceof Error ? error.message : 'Ошибка поиска'}</p>
              <Button variant="secondary" size="xs" onClick={handleRetry}>Повторить</Button>
            </div>
          )}

          {!isLoading && !isError && results.length === 0 && hasSearched && (
            <div className="py-4 text-center text-xs text-text-muted">Ничего не найдено в регионе</div>
          )}

          {!isLoading && !isError && results.length > 0 && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-text-muted">Найдено групп: {data?.total ?? results.length}</p>
                {unsavedMissing.length > 0 && (
                  <Button
                    variant="soft" size="xs" semantic="default"
                    onClick={handleSaveAll}
                    disabled={saveMutation.isPending}
                    icon={<Plus size={12} />}
                  >
                    Добавить все ({unsavedMissing.length})
                  </Button>
                )}
              </div>
              <TableShell>
                <TableHead columns={columns} />
                <tbody>
                  {results.map((group) => {
                    const isSaving = saveMutation.isPending && saveMutation.variables === group.vkId
                    const isSaved = savedIds.has(group.vkId) || group.existsInDb
                    return (
                      <RegionResultRow
                        key={group.vkId}
                        group={group}
                        isSaved={isSaved}
                        isSaving={isSaving}
                        onSave={handleSave}
                      />
                    )
                  })}
                </tbody>
              </TableShell>
            </>
          )}
        </div>
      )}
    </div>
  )
}

type RowProps = {
  group: RegionGroup
  isSaved: boolean
  isSaving: boolean
  onSave: (id: number) => void
}

function RegionResultRow({ group, isSaved, isSaving, onSave }: RowProps) {
  const profileUrl = group.screenName
    ? `https://vk.com/${group.screenName}`
    : `https://vk.com/club${group.vkId}`

  return (
    <tr className="border-b border-border last:border-0 text-xs hover:bg-bg-hover transition-colors duration-150">
      <td className="px-3 py-2">
        {group.photo50 ? (
          <img src={group.photo50} alt="" className="h-8 w-8 rounded object-cover" loading="lazy" />
        ) : (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-bg-hover text-text-muted" role="img" aria-label="Аватар отсутствует">
            <Building2 size={14} />
          </span>
        )}
      </td>
      <td className="px-3 py-2">
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block font-medium text-text-primary hover:text-accent transition-colors duration-150"
        >
          {group.name || group.screenName || `Группа #${group.vkId}`}
        </a>
        {group.screenName && (
          <span className="text-text-muted">@{group.screenName}</span>
        )}
      </td>
      <td className="px-3 py-2 text-text-secondary tabular-nums">
        {group.membersCount?.toLocaleString('ru-RU') ?? '—'}
      </td>
      <td className="px-3 py-2 text-text-secondary">
        {group.city?.title ?? '—'}
      </td>
      <td className="px-3 py-2">
        {isSaved ? (
          <span className="inline-flex items-center gap-1 rounded-sm bg-success-soft px-1.5 py-0.5 text-xs font-medium text-success">
            <Check size={10} />
            В БД
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-sm bg-warning-soft px-1.5 py-0.5 text-xs font-medium text-warning">
            <X size={10} />
            Нет в БД
          </span>
        )}
      </td>
      <td className="px-3 py-2">
        {!isSaved && (
          <Button
            variant="ghost" size="xs" semantic="default"
            className="max-sm:min-h-[44px] max-sm:min-w-[44px]"
            onClick={() => onSave(group.vkId)}
            disabled={isSaving}
            aria-label={`Добавить ${group.name ?? ''}`}
            icon={isSaving ? <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Plus size={13} />}
          >
            Добавить
          </Button>
        )}
      </td>
    </tr>
  )
}
