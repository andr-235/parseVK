import { useState, useEffect, useMemo } from 'react'
import PageTitle from '../components/PageTitle'
import Table from '../components/Table'
import GroupInput from '../components/GroupInput'
import Button from '../components/Button'
import FileUpload from '../components/FileUpload'
import { useGroupsStore } from '../stores'
import { getGroupTableColumns } from '../config/groupTableColumns'
import './Groups.css'

function Groups() {
  const groups = useGroupsStore((state) => state.groups)
  const isLoading = useGroupsStore((state) => state.isLoading)
  const fetchGroups = useGroupsStore((state) => state.fetchGroups)
  const addGroup = useGroupsStore((state) => state.addGroup)
  const deleteGroup = useGroupsStore((state) => state.deleteGroup)
  const loadFromFile = useGroupsStore((state) => state.loadFromFile)
  const deleteAllGroups = useGroupsStore((state) => state.deleteAllGroups)
  const [url, setUrl] = useState('')

  const totalGroups = useMemo(() => groups.length, [groups])
  const hasGroups = totalGroups > 0

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
              <span className="groups-stat-card__value">{isLoading ? '—' : totalGroups}</span>
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

      <section className="groups-actions">
        <div className="groups-actions__block">
          <h3 className="groups-actions__title">Добавить вручную</h3>
          <GroupInput
            url={url}
            onUrlChange={(e) => setUrl(e.target.value)}
            onAdd={handleAddGroup}
          />
          <p className="groups-actions__hint">
            Вставьте полный URL сообщества — мы автоматически получим его информацию и добавим в таблицу.
          </p>
        </div>

        <div className="groups-divider" aria-hidden="true" />

        <div className="groups-actions__block">
          <h3 className="groups-actions__title">Импорт из файла</h3>
          <FileUpload
            onUpload={handleFileUpload}
            buttonText="Загрузить из файла"
          />
          <p className="groups-actions__hint">
            Поддерживаются текстовые файлы со ссылками на группы. Каждая ссылка должна быть указана с новой строки.
          </p>
        </div>
      </section>

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
          <div className="groups-table-card__header-controls">
            {!isLoading && (
              <span className="groups-table-card__counter">
                {totalGroups} {totalGroups === 1 ? 'группа' : totalGroups >= 2 && totalGroups <= 4 ? 'группы' : 'групп'}
              </span>
            )}
            <Button
              onClick={handleDeleteAllGroups}
              disabled={!hasGroups || isLoading}
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
