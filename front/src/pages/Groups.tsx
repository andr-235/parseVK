import { useState, useEffect } from 'react'
import { useGroupsStore } from '../stores'
import { getGroupTableColumns } from '../config/groupTableColumns'
import GroupsActionsPanel from './Groups/components/GroupsActionsPanel'
import './Groups.css'
import GroupsHero from './Groups/components/GroupsHero'
import GroupsTableCard from './Groups/components/GroupsTableCard'

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

  const groupsCount = groups.length
  const hasGroups = groupsCount > 0

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const handleAddGroup = async () => {
    if (await addGroup(url)) {
      setUrl('')
    }
  }

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="groups-page">
      <section className="groups-hero">
        <div className="groups-hero__content">
          <PageTitle>Группы</PageTitle>
          <p className="groups-hero__subtitle">
            Управляйте списком сообществ, добавляйте новые источники вручную или импортируйте их из файла.
            Сводка ниже помогает оценить состояние каталога и статус обновления данных.
          </p>

          <div className="groups-stats">
            <div className="groups-stat-card">
              <span className="groups-stat-card__label">Всего групп</span>
              <span className="groups-stat-card__value">{isLoading ? '—' : groupsCount}</span>
              <span className="groups-stat-card__hint">
                {isLoading
                  ? 'Получаем актуальный список сообществ'
                  : hasGroups
                    ? 'Список готов к работе — таблица ниже покажет подробности'
                    : 'Пока что список пуст — добавьте первую группу, чтобы начать'}
              </span>
            </div>

            <div className="groups-stat-card">
              <span className="groups-stat-card__label">Статус обновления</span>
              <span className={`groups-badge ${isLoading ? 'groups-badge--loading' : 'groups-badge--ready'}`}>
                {isLoading ? 'Обновляем данные' : 'Актуальные данные'}
              </span>
              <span className="groups-stat-card__hint">
                {isLoading
                  ? 'Это может занять несколько секунд'
                  : 'Последняя загрузка данных завершена успешно'}
              </span>
            </div>
          </div>
        </div>

        <aside className="groups-hero__side">
          <div className="groups-hero__card">
            <h2 className="groups-hero__title">Как начать работу</h2>
            <ul className="groups-hero__list">
              <li>Вставьте ссылку на сообщество ВК и нажмите «Добавить».</li>
              <li>Загрузите заранее подготовленный файл со списком ссылок.</li>
              <li>Следите за статусом импорта — новые записи появятся в таблице автоматически.</li>
            </ul>
          </div>
        </aside>
      </section>

      <GroupsActionsPanel
        onAdd={handleAddGroup}
        onUpload={handleFileUpload}
        isLoading={isLoading}
        url={url}
        setUrl={setUrl}
      />

      <GroupsTableCard
        groups={groups}
        isLoading={isLoading}
        onClear={handleDeleteAllGroups}
        onDelete={deleteGroup}
        columns={getGroupTableColumns}
      />
    </div>
  )
}

export default Groups
