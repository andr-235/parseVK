import GroupInput from '@/components/groups/GroupInput'
import FileUpload from '@/components/common/FileUpload'

interface GroupsHeroProps {
  url: string
  onUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onAdd: () => void
  onFilesSelect: (files: File[]) => void
}

export const GroupsHero = ({ url, onUrlChange, onAdd, onFilesSelect }: GroupsHeroProps) => {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2.5">
        <h1 className="font-monitoring-display text-3xl font-bold tracking-tight text-foreground">
          VK Группы
        </h1>
        <p className="max-w-2xl text-text-secondary font-monitoring-body">
          Управляйте VK сообществами: добавляйте группы для парсинга, отслеживайте их метрики и
          аудиторию.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
        <GroupInput url={url} onUrlChange={onUrlChange} onAdd={onAdd} />
        <FileUpload onFilesSelect={onFilesSelect} buttonText="Импорт" className="shrink-0" />
      </div>
    </div>
  )
}
