import { useEffect, useMemo, useState } from 'react'
import type { Group } from '../types'

interface CreateParseTaskModalProps {
  isOpen: boolean
  groups: Group[]
  isLoading: boolean
  onClose: () => void
  onSubmit: (groupIds: Array<number | string>) => void
}

const getDisplayName = (group: Group): string => {
  if (group.name && group.name.trim() !== '') {
    return group.name
  }

  if (group.screenName && group.screenName.trim() !== '') {
    return group.screenName
  }

  if (typeof group.vkId === 'number') {
    return 'Группа ' + group.vkId
  }

  return 'Группа ' + group.id
}

function CreateParseTaskModal({ isOpen, groups, isLoading, onClose, onSubmit }: CreateParseTaskModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds(new Set())
      setSearch('')
      return
    }

    setSelectedIds(new Set(groups.map((group) => group.id)))
  }, [isOpen, groups])

  const filteredGroups = useMemo(() => {
    if (!search.trim()) {
      return groups
    }

    const normalized = search.toLowerCase()
    return groups.filter((group) => {
      const display = getDisplayName(group).toLowerCase()
      const vkId = group.vkId ? String(group.vkId) : ''
      const id = String(group.id)
      return display.includes(normalized) || vkId.includes(normalized) || id.includes(normalized)
    })
  }, [groups, search])

  const handleToggle = (groupId: number | string) => {
    setSelectedIds((prev) => {
      const updated = new Set(prev)
      if (updated.has(groupId)) {
        updated.delete(groupId)
      } else {
        updated.add(groupId)
      }
      return updated
    })
  }

  const handleSelectAll = () => {
    setSelectedIds(new Set(groups.map((group) => group.id)))
  }

  const handleDeselectAll = () => {
    setSelectedIds(new Set())
  }

  const handleSubmit = () => {
    const ids = Array.from(selectedIds)
    onSubmit(ids)
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Создание задачи на парсинг групп</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="group-selection-header">
            <p>Выберите группы, которые нужно распарсить.</p>
            <div className="group-selection-actions">
              <button type="button" className="link-button" onClick={handleSelectAll}>
                Выбрать все
              </button>
              <button type="button" className="link-button" onClick={handleDeselectAll}>
                Снять выделение
              </button>
            </div>
            <input
              type="text"
              className="group-search-input"
              placeholder="Поиск по названию или ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="group-selection-list">
            {filteredGroups.length === 0 ? (
              <div className="empty-state">Нет групп по заданным условиям</div>
            ) : (
              filteredGroups.map((group) => {
                const displayName = getDisplayName(group)
                const isChecked = selectedIds.has(group.id)

                return (
                  <label key={group.id} className="group-selection-item">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(group.id)}
                    />
                    <span className="group-name">{displayName}</span>
                    {group.vkId ? <span className="group-meta">{'vk.com/club' + group.vkId}</span> : null}
                  </label>
                )
              })
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="button secondary" onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className="button"
            onClick={handleSubmit}
            disabled={isLoading || selectedIds.size === 0}
          >
            {isLoading ? 'Создание...' : 'Создать (' + selectedIds.size + ')'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateParseTaskModal
