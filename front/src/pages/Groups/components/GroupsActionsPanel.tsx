import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import GroupInput from '../../../components/GroupInput'
import FileUpload from '../../../components/FileUpload'
import SectionCard from '../../../components/SectionCard'

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
    <SectionCard
      title="Добавление новых групп"
      description="Добавьте сообщество по ссылке или загрузите список групп из файла."
      headerClassName="border-none pb-4"
      contentClassName="pt-0"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex-1">
          <GroupInput url={url} onUrlChange={handleUrlChange} onAdd={handleAdd} />
        </div>
        <FileUpload onUpload={onUpload} buttonText="Загрузить из файла" />
      </div>
    </SectionCard>
  )
}

export default GroupsActionsPanel
