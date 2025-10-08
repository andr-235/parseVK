import clsx from 'clsx'
import PageTitle from '../../../components/PageTitle'

type GroupsHeroProps = {
  isLoading: boolean
  totalGroups: number
  hasGroups: boolean
}

function GroupsHero({ isLoading, totalGroups, hasGroups }: GroupsHeroProps) {
  const statusBadgeClassName = clsx(
    'inline-flex min-h-10 items-center justify-center rounded-full px-5 py-2 text-sm font-semibold uppercase tracking-[0.05em] text-center transition-colors',
    isLoading
      ? 'bg-[rgba(241,196,15,0.2)] text-[#d4ac0d] dark:bg-[rgba(241,196,15,0.28)] dark:text-[#f9e79f]'
      : 'bg-[rgba(46,204,113,0.2)] text-[#1e8449] dark:bg-[rgba(46,204,113,0.28)] dark:text-[#7dcea0]'
  )

  return (
    <section
      className="grid gap-6 rounded-[26px] border border-[rgba(52,152,219,0.18)] bg-[linear-gradient(135deg,rgba(52,152,219,0.1),rgba(52,152,219,0.03))] p-6 shadow-[0_28px_54px_-36px_rgba(52,152,219,0.45)] transition-shadow md:gap-8 md:p-8 xl:p-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] dark:border-[rgba(93,173,226,0.25)] dark:bg-[linear-gradient(135deg,rgba(93,173,226,0.16),rgba(40,116,166,0.08))] dark:shadow-[0_34px_64px_-44px_rgba(93,173,226,0.7)]"
    >
      <div className="flex flex-col gap-6 md:gap-7">
        <div className="flex flex-col gap-4">
          <PageTitle>Группы</PageTitle>
          <p className="max-w-[640px] text-base leading-relaxed text-text-secondary">
            Управляйте списком сообществ: добавляйте новые источники вручную, импортируйте их из файлов и отслеживайте
            состояние каталога. Ниже — быстрый срез по количеству и статусу обновления данных.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          <article
            className={clsx(
              'flex flex-col gap-5 rounded-[22px] border border-border bg-background-secondary p-6 shadow-[0_22px_44px_-36px_rgba(0,0,0,0.28)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_26px_48px_-32px_rgba(52,152,219,0.38)] md:p-7 dark:shadow-[0_28px_56px_-32px_rgba(93,173,226,0.55)]',
              'bg-[linear-gradient(135deg,rgba(52,152,219,0.12),rgba(52,152,219,0))] border-[rgba(52,152,219,0.28)] dark:bg-[linear-gradient(135deg,rgba(93,173,226,0.25),rgba(52,152,219,0.05))] dark:border-[rgba(93,173,226,0.35)]'
            )}
          >
            <header className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-[rgba(52,73,94,0.7)] dark:text-[rgba(236,240,241,0.7)]">
                Всего групп
              </span>
            </header>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-4xl font-bold text-[#3498db] md:text-5xl dark:text-[#5dade2]">
                {isLoading ? '—' : totalGroups}
              </span>
              {!isLoading && (
                <span className="inline-flex items-center justify-center rounded-full bg-[rgba(52,152,219,0.16)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.04em] text-[#1b4f72] dark:bg-[rgba(93,173,226,0.28)] dark:text-[rgba(236,240,241,0.9)]">
                  {hasGroups ? 'Каталог активен' : 'Пока пусто'}
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">
              {isLoading
                ? 'Получаем актуальные данные — таблица ниже обновится автоматически.'
                : hasGroups
                  ? 'Список готов к работе: управляйте сообществами и следите за их состоянием ниже.'
                  : 'Список пуст. Добавьте первую группу или воспользуйтесь импортом, чтобы начать анализ.'}
            </p>
          </article>

          <article className="flex flex-col gap-5 rounded-[22px] border border-border bg-background-secondary p-6 shadow-[0_22px_44px_-36px_rgba(0,0,0,0.28)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_26px_48px_-32px_rgba(52,152,219,0.38)] md:p-7 dark:shadow-[0_28px_56px_-32px_rgba(93,173,226,0.55)]">
            <header className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-[rgba(52,73,94,0.7)] dark:text-[rgba(236,240,241,0.7)]">
                Статус синхронизации
              </span>
            </header>
            <span className={statusBadgeClassName}>{isLoading ? 'Обновляем данные' : 'Актуальные данные'}</span>
            <p className="text-sm leading-relaxed text-text-secondary">
              {isLoading
                ? 'Это займёт немного времени. Мы загрузим и проверим новые записи.'
                : hasGroups
                  ? 'Последняя синхронизация прошла успешно. Новые данные отображаются в таблице.'
                  : 'Как только вы добавите группы, здесь появится статус их последней загрузки.'}
            </p>
          </article>
        </div>
      </div>

      <aside className="order-first flex lg:order-none">
        <div className="flex flex-col gap-5 rounded-[24px] border border-border bg-background-secondary p-6 shadow-[0_22px_44px_-36px_rgba(0,0,0,0.3)] md:gap-6 md:p-7">
          <h2 className="text-2xl font-bold text-text-primary">Как начать работу</h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            Следуйте шагам, чтобы быстро собрать каталог сообществ и подготовить данные к анализу.
          </p>
          <ol className="space-y-4 md:space-y-5">
            <li className="flex items-start gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(52,152,219,0.18)] text-base font-semibold text-[#1b4f72] md:h-12 md:w-12 md:text-lg dark:bg-[rgba(93,173,226,0.32)] dark:text-[rgba(236,240,241,0.9)]">
                1
              </span>
              <div>
                <h3 className="mb-1 text-base font-semibold text-text-primary">Добавьте ссылку</h3>
                <p className="text-sm leading-relaxed text-text-secondary">Вставьте URL сообщества ВК и нажмите «Добавить».</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(52,152,219,0.18)] text-base font-semibold text-[#1b4f72] md:h-12 md:w-12 md:text-lg dark:bg-[rgba(93,173,226,0.32)] dark:text-[rgba(236,240,241,0.9)]">
                2
              </span>
              <div>
                <h3 className="mb-1 text-base font-semibold text-text-primary">Импортируйте файл</h3>
                <p className="text-sm leading-relaxed text-text-secondary">Загрузите текстовый список ссылок, чтобы ускорить наполнение.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(52,152,219,0.18)] text-base font-semibold text-[#1b4f72] md:h-12 md:w-12 md:text-lg dark:bg-[rgba(93,173,226,0.32)] dark:text-[rgba(236,240,241,0.9)]">
                3
              </span>
              <div>
                <h3 className="mb-1 text-base font-semibold text-text-primary">Проверьте статус</h3>
                <p className="text-sm leading-relaxed text-text-secondary">Отслеживайте прогресс — новые записи сразу появятся в таблице.</p>
              </div>
            </li>
          </ol>
        </div>
      </aside>
    </section>
  )
}

export default GroupsHero
