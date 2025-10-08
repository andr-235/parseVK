import { useState, useEffect } from 'react'
import Table from '../components/Table'
import Button from '../components/Button'
import { useGroupsStore } from '../stores'
import { getGroupTableColumns } from '../config/groupTableColumns'
import GroupsActionsPanel from './Groups/components/GroupsActionsPanel'
import './Groups.css'
import GroupsHero from './Groups/components/GroupsHero'

function Groups() {
  const groups = useGroupsStore((state) => state.groups)
  const isLoading = useGroupsStore((state) => state.isLoading)
  const totalGroups = useGroupsStore((state) => state.groups.length)
  const hasGroups = useGroupsStore((state) => state.groups.length > 0)
  const fetchGroups = useGroupsStore((state) => state.fetchGroups)
  const addGroup = useGroupsStore((state) => state.addGroup)
  const deleteGroup = useGroupsStore((state) => state.deleteGroup)
  const loadFromFile = useGroupsStore((state) => state.loadFromFile)
  const deleteAllGroups = useGroupsStore((state) => state.deleteAllGroups)
  const [url, setUrl] = useState('')

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const handleAddGroup = async () => {
    if (await addGroup(url)) {
      setUrl('')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await loadFromFile(file)
    }
  }

  const handleDeleteAllGroups = async () => {
    if (!hasGroups || isLoading) {
      return
    }

    const confirmed = window.confirm('Удалить все группы из списка и базы данных? Это действие нельзя отменить.')
    if (!confirmed) {
      return
    }

    try {
      await deleteAllGroups()
    } catch {
      // Ошибки обрабатываются в сервисе
    }
  }

  const isDeleteDisabled = !hasGroups || isLoading

  return (
    <div className="groups-page">
      <GroupsHero
        isLoading={isLoading}
        totalGroups={totalGroups}
        hasGroups={hasGroups}
      />

      <GroupsActionsPanel
        onAdd={handleAddGroup}
        onUpload={handleFileUpload}
        isLoading={isLoading}
        url={url}
        setUrl={setUrl}
      />

      <section className="groups-table-card">
        <div className="groups-table-card__header">
          <div>
            <h2 className="groups-table-card__title">Список групп</h2>
            <p className="groups-table-card__subtitle">
              {isLoading
                ? 'Мы подготавливаем данные...'
                : hasGroups
                  ? 'Ниже отображаются все добавленные сообщества. Вы можете удалить любую запись из таблицы.'
                  : 'После добавления групп их карточки появятся в таблице с возможностью управления.'}
            </p>
          </div>
          <div className="groups-table-card__actions">
            {!isLoading && (
              <span className="groups-table-card__counter">
                {totalGroups} {totalGroups === 1 ? 'группа' : totalGroups >= 2 && totalGroups <= 4 ? 'группы' : 'групп'}
              </span>
            )}
            <Button
              onClick={handleDeleteAllGroups}
              disabled={isDeleteDisabled}
              variant="danger"
              className="groups-table-card__clear-button"
            >
              Очистить список
            </Button>
          </div>
        </div>

        <Table
          columns={getGroupTableColumns(deleteGroup)}
          data={groups}
          emptyMessage={isLoading ? 'Загрузка...' : 'Нет групп. Добавьте новую группу или загрузите из файла.'}
        />
      </section>
    </div>
  )
}

export default Groups
