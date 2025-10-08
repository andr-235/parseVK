import { useMemo } from 'react'
import type { ReactNode } from 'react'
import Button from '../../../components/Button'
import Table from '../../../components/Table'
import type { Group, TableColumn } from '../../../types'
import styles from './GroupsTableCard.module.css'

type ColumnsFactory = (deleteGroup: (id: number) => void) => TableColumn[]

interface GroupsTableCardProps {
  groups: Group[]
  isLoading: boolean
  onClear: () => void | Promise<void>
  onDelete: (id: number) => void
  columns: ColumnsFactory
}

const getCounterLabel = (count: number) => {
  const remainder10 = count % 10
  const remainder100 = count % 100

  if (remainder10 === 1 && remainder100 !== 11) {
    return 'группа'
  }

  if (remainder10 >= 2 && remainder10 <= 4 && (remainder100 < 12 || remainder100 > 14)) {
    return 'группы'
  }

  return 'групп'
}

function GroupsTableCard({ groups, isLoading, onClear, onDelete, columns }: GroupsTableCardProps) {
  const hasGroups = groups.length > 0

  const tableColumns = useMemo(() => columns(onDelete), [columns, onDelete])

  const subtitle = useMemo(() => {
    if (isLoading && !hasGroups) {
      return 'Мы подготавливаем данные и проверяем их перед отображением.'
    }

    if (hasGroups) {
      return 'Ниже отображаются все добавленные сообщества. Вы можете открыть группу во вкладке VK или удалить её из базы.'
    }

    return 'После добавления групп их карточки появятся в таблице, и вы сможете управлять ими из одного места.'
  }, [hasGroups, isLoading])

  const clearDisabled = isLoading || !hasGroups

  let body: ReactNode

  if (isLoading && !hasGroups) {
    body = (
      <div className={styles.loadingState} aria-live="polite" aria-busy="true">
        <div className={styles.loader} />
        <p className={styles.loadingText}>Загружаем группы…</p>
      </div>
    )
  } else if (!hasGroups) {
    body = (
      <div className={styles.emptyState} role="status">
        <div className={styles.emptyIllustration} aria-hidden="true">
          <div className={styles.emptyIcon}>📁</div>
        </div>
        <h3 className={styles.emptyTitle}>Список пуст</h3>
        <p className={styles.emptyDescription}>
          Добавьте группы по ссылке или загрузите список из файла — после обработки данные появятся здесь и будут доступны для управления.
        </p>
      </div>
    )
  } else {
    body = (
      <div className={styles.tableContainer}>
        <Table
          columns={tableColumns}
          data={groups}
          emptyMessage="Нет групп. Добавьте новую группу или загрузите из файла."
        />
      </div>
    )
  }

  return (
    <section className={styles.card} aria-label="Список групп">
      <header className={styles.header}>
        <div className={styles.info}>
          <h2 className={styles.title}>Список групп</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <div className={styles.controls}>
          <div className={styles.meta}>
            {isLoading ? (
              <span className={styles.loadingBadge}>Загрузка…</span>
            ) : (
              <span className={styles.counter}>
                {groups.length} {getCounterLabel(groups.length)}
              </span>
            )}
          </div>
          <div className={styles.actions}>
            <Button className={styles.filtersButton} variant="secondary" disabled>
              Фильтры (скоро)
            </Button>
            <Button
              className={styles.clearButton}
              variant="danger"
              onClick={onClear}
              disabled={clearDisabled}
            >
              Очистить список
            </Button>
          </div>
        </div>
      </header>

      {body}
    </section>
  )
}

export default GroupsTableCard
