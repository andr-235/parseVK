import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import { Separator } from '../../../components/ui/separator'
import GroupInput from '../../../components/GroupInput'
import FileUpload from '../../../components/FileUpload'
import { StepCard } from './StepCard'

interface GroupsActionsPanelProps {
  onAdd: () => Promise<void> | void
  onUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void> | void
  isLoading: boolean
  url: string
  setUrl: Dispatch<SetStateAction<string>>
}

function GroupsActionsPanel({ onAdd, onUpload, isLoading, url, setUrl }: GroupsActionsPanelProps) {
  const handleUrlChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
    setUrl(target.value)
  }

  const handleAdd = () => {
    void onAdd()
  }

  return (
    <section className="flex flex-col gap-8 rounded-[26px] border border-border bg-background-secondary p-6 shadow-[0_22px_46px_-34px_rgba(0,0,0,0.32)] md:gap-10 md:p-8 dark:shadow-[0_28px_56px_-34px_rgba(93,173,226,0.5)]">
      <header className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-text-primary">Добавление новых групп</h2>
        <p className="max-w-[640px] text-[15px] leading-relaxed text-text-secondary">
          Выберите подходящий способ: вставьте ссылку на сообщество или загрузите подготовленный файл. Мы подскажем, что делать
          дальше.
        </p>
      </header>

      <div className="grid items-stretch gap-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <StepCard
          stepNumber={1}
          title="Добавить вручную"
          description="Вставьте URL сообщества ВК — мы проверим ссылку и автоматически добавим группу в список."
          hint={
            <>
              Подсказка: можно вставить ссылку из адресной строки браузера.
              {isLoading && ' Подождите завершения текущей операции.'}
            </>
          }
        >
          <GroupInput url={url} onUrlChange={handleUrlChange} onAdd={handleAdd} />
        </StepCard>

        <Separator
          orientation="vertical"
          className="hidden h-full bg-[linear-gradient(180deg,rgba(52,152,219,0)_0%,rgba(52,152,219,0.35)_50%,rgba(52,152,219,0)_100%)] md:block"
        />

        <StepCard
          stepNumber={2}
          title="Импорт из файла"
          description="Загрузите текстовый файл со ссылками. Каждая ссылка должна находиться на новой строке."
          hint={
            <>
              Мы обработаем файл и добавим все найденные сообщества автоматически.
              {isLoading && ' Импорт может занять некоторое время.'}
            </>
          }
        >
          <FileUpload onUpload={onUpload} buttonText="Загрузить из файла" />
        </StepCard>
      </div>
    </section>
  )
}

export default GroupsActionsPanel
