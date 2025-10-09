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

function GroupsActionsPanel({ onAdd, onUpload, url, setUrl }: GroupsActionsPanelProps) {
  const handleUrlChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
    setUrl(target.value)
  }

  const handleAdd = () => {
    void onAdd()
  }

  return (
    <section className="flex flex-col gap-6 rounded-[26px] border border-border bg-background-secondary p-6 shadow-[0_22px_46px_-34px_rgba(0,0,0,0.32)] dark:shadow-[0_28px_56px_-34px_rgba(93,173,226,0.5)]">
      <h2 className="text-2xl font-bold text-text-primary">Добавление новых групп</h2>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex-1">
          <GroupInput url={url} onUrlChange={handleUrlChange} onAdd={handleAdd} />
        </div>
        <FileUpload onUpload={onUpload} buttonText="Загрузить из файла" />
      </div>
    </section>
  )
}

export default GroupsActionsPanel
