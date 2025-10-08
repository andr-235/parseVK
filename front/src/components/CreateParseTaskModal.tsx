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
      <div
        className="modal-content modal-content--enhanced"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-parse-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <h2 id="create-parse-modal-title">Создание задачи на парсинг групп</h2>
            <p>
              Сформируйте список групп с помощью поиска и быстрых действий. Мы сразу подсчитаем выбранные
              сообщества и подскажем, сколько осталось.
            </p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Закрыть модальное окно"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-body-top">
            <div className="selection-summary" role="status" aria-live="polite">
              <div className="selection-summary__count">{selectedIds.size}</div>
              <div className="selection-summary__text">
                <span className="selection-summary__label">Выбрано групп</span>
                <span className="selection-summary__meta">
                  из {groups.length} доступных • найдено {filteredGroups.length}
                </span>
              </div>
            </div>
            <div className="selection-actions">
              <button type="button" className="chip-button" onClick={handleSelectAll}>
                Выбрать все
              </button>
              <button type="button" className="chip-button chip-button--ghost" onClick={handleDeselectAll}>
                Снять выделение
              </button>
            </div>
          </div>

          <div className="group-selection-header">
            <div className="input-with-icon">
              <span className="input-icon" aria-hidden="true">
                🔍
              </span>
              <input
                type="text"
                className="group-search-input"
                placeholder="Поиск по названию, ссылке или ID"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <p className="group-selection-hint">
              Начните вводить название или идентификатор — список обновится мгновенно.
            </p>
          </div>

          <div className="group-selection-list">
            {filteredGroups.length === 0 ? (
              <div className="empty-state">
                <h3>Не нашли подходящих групп</h3>
                <p>Попробуйте изменить запрос или сбросить фильтры выбора.</p>
              </div>
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
                    <div className="group-info">
                      <span className="group-name">{displayName}</span>
                      {group.vkId ? <span className="group-meta">{'vk.com/club' + group.vkId}</span> : null}
                    </div>
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
