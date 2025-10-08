import { useMemo } from 'react'
import type { ReactNode } from 'react'
import clsx from 'clsx'
import Button from '../../../components/Button'
import Table from '../../../components/Table'
import type { Group, TableColumn } from '../../../types'

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
      <div
        className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-[20px] bg-background-primary p-10 text-center text-text-secondary md:p-12"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="h-12 w-12 rounded-full border-4 border-[rgba(52,152,219,0.2)] border-t-[#3498db] animate-spin" />
        <p className="font-semibold text-text-primary">Загружаем группы…</p>
      </div>
    )
  } else if (!hasGroups) {
    body = (
      <div
        className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-[20px] bg-background-primary p-10 text-center text-text-secondary md:p-12"
        role="status"
      >
        <div className="grid place-items-center rounded-[30px] border border-dashed border-[rgba(52,152,219,0.35)] bg-[linear-gradient(135deg,rgba(52,152,219,0.16),rgba(52,152,219,0.04))] p-6">
          <div className="flex h-[clamp(56px,16vw,68px)] w-[clamp(56px,16vw,68px)] items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(52,152,219,0.2),rgba(52,152,219,0.05))] text-[clamp(28px,8vw,36px)] text-[#3498db]">
            📁
          </div>
        </div>
        <h3 className="text-lg font-semibold text-text-primary">Список пуст</h3>
        <p className="max-w-[420px] text-[15px] leading-relaxed">
          Добавьте группы по ссылке или загрузите список из файла — после обработки данные появятся здесь и будут доступны для
          управления.
        </p>
      </div>
    )
  } else {
    body = (
      <div className="overflow-x-auto rounded-[20px]">
        <Table
          columns={tableColumns}
          data={groups}
          emptyMessage="Нет групп. Добавьте новую группу или загрузите из файла."
        />
      </div>
    )
  }

  const metaBadgeClassName = 'inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.04em]'

  return (
    <section className="flex flex-col gap-8 rounded-[26px] border border-border bg-background-secondary p-6 shadow-[0_24px_48px_-34px_rgba(0,0,0,0.28)] md:gap-10 md:p-8 dark:shadow-[0_28px_56px_-34px_rgba(93,173,226,0.5)]" aria-label="Список групп">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex min-w-[260px] flex-1 flex-col gap-2">
          <h2 className="text-2xl font-bold text-text-primary">Список групп</h2>
          <p className="max-w-[640px] text-[15px] leading-relaxed text-text-secondary">{subtitle}</p>
        </div>
        <div className="flex min-w-[220px] flex-col items-end gap-3">
          <div className="flex w-full flex-wrap items-center justify-end gap-3">
            {isLoading ? (
              <span className={clsx(metaBadgeClassName, 'bg-[rgba(241,196,15,0.18)] text-[#f1c40f] dark:text-[#f9e79f]')}>
                Загрузка…
              </span>
            ) : (
              <span className={clsx(metaBadgeClassName, 'bg-[rgba(52,152,219,0.12)] text-[#3498db] dark:text-[#5dade2]')}>
                {groups.length} {getCounterLabel(groups.length)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Button className="min-w-[160px]" variant="secondary" disabled>
              Фильтры (скоро)
            </Button>
            <Button className="min-w-[180px]" variant="danger" onClick={onClear} disabled={clearDisabled}>
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
