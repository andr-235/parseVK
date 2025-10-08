import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import GroupInput from '../../../components/GroupInput'
import FileUpload from '../../../components/FileUpload'

interface GroupsActionsPanelProps {
  onAdd: () => Promise<void> | void
  onUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void> | void
  isLoading: boolean
  url: string
  setUrl: Dispatch<SetStateAction<string>>
}

function GroupsActionsPanel({ onAdd, onUpload, isLoading, url, setUrl }: GroupsActionsPanelProps) {
  const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value)
  }

  const handleAdd = () => {
    void onAdd()
  }

  return (
    <section className="flex flex-col gap-8 rounded-[26px] border border-border bg-background-secondary p-6 shadow-[0_22px_46px_-34px_rgba(0,0,0,0.32)] md:gap-10 md:p-8 dark:shadow-[0_28px_56px_-34px_rgba(93,173,226,0.5)]">
      <header className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-text-primary">Добавление новых групп</h2>
        <p className="max-w-[640px] text-[15px] leading-relaxed text-text-secondary">
          Выберите подходящий способ: вставьте ссылку на сообщество или загрузите подготовленный файл. Мы подскажем, что
          делать дальше.
        </p>
      </header>

      <div className="grid items-stretch gap-6 md:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]">
        <article className="flex flex-col gap-5 rounded-[22px] border border-[rgba(52,152,219,0.18)] bg-[linear-gradient(135deg,rgba(52,152,219,0.08),rgba(52,152,219,0.02))] p-6 shadow-[0_18px_32px_-28px_rgba(0,0,0,0.25)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgba(52,152,219,0.35)] md:p-7 dark:border-[rgba(93,173,226,0.3)] dark:bg-[linear-gradient(135deg,rgba(93,173,226,0.14),rgba(46,134,193,0.05))] dark:shadow-[0_24px_48px_-32px_rgba(93,173,226,0.45)] dark:hover:shadow-[0_28px_56px_-32px_rgba(93,173,226,0.55)]">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center rounded-full bg-[rgba(52,152,219,0.2)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#2c3e50] dark:bg-[rgba(93,173,226,0.3)] dark:text-[#ecf0f1]">
              Шаг 1
            </span>
            <h3 className="text-lg font-semibold text-text-primary">Добавить вручную</h3>
          </div>
          <p className="text-sm leading-relaxed text-text-secondary">
            Вставьте URL сообщества ВК — мы проверим ссылку и автоматически добавим группу в список.
          </p>

          <GroupInput url={url} onUrlChange={handleUrlChange} onAdd={handleAdd} />

          <p className="text-xs leading-relaxed text-[rgba(44,62,80,0.75)] dark:text-[rgba(236,240,241,0.75)]">
            Подсказка: можно вставить ссылку из адресной строки браузера.
            {isLoading && ' Подождите завершения текущей операции.'}
          </p>
        </article>

        <div
          className="hidden h-full w-px rounded-full bg-[linear-gradient(180deg,rgba(52,152,219,0)_0%,rgba(52,152,219,0.35)_50%,rgba(52,152,219,0)_100%)] md:block"
          aria-hidden="true"
        />

        <article className="flex flex-col gap-5 rounded-[22px] border border-[rgba(52,152,219,0.18)] bg-[linear-gradient(135deg,rgba(52,152,219,0.08),rgba(52,152,219,0.02))] p-6 shadow-[0_18px_32px_-28px_rgba(0,0,0,0.25)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgba(52,152,219,0.35)] md:p-7 dark:border-[rgba(93,173,226,0.3)] dark:bg-[linear-gradient(135deg,rgba(93,173,226,0.14),rgba(46,134,193,0.05))] dark:shadow-[0_24px_48px_-32px_rgba(93,173,226,0.45)] dark:hover:shadow-[0_28px_56px_-32px_rgba(93,173,226,0.55)]">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center rounded-full bg-[rgba(52,152,219,0.2)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#2c3e50] dark:bg-[rgba(93,173,226,0.3)] dark:text-[#ecf0f1]">
              Шаг 2
            </span>
            <h3 className="text-lg font-semibold text-text-primary">Импорт из файла</h3>
          </div>
          <p className="text-sm leading-relaxed text-text-secondary">
            Загрузите текстовый файл со ссылками. Каждая ссылка должна находиться на новой строке.
          </p>

          <FileUpload onUpload={onUpload} buttonText="Загрузить из файла" />

          <p className="text-xs leading-relaxed text-[rgba(44,62,80,0.75)] dark:text-[rgba(236,240,241,0.75)]">
            Мы обработаем файл и добавим все найденные сообщества автоматически.
            {isLoading && ' Импорт может занять некоторое время.'}
          </p>
        </article>
      </div>
    </section>
  )
}

export default GroupsActionsPanel
