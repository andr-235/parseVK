import PageTitle from '@/components/PageTitle'
import GroupInput from '@/modules/groups/components/GroupInput'
import FileUpload from '@/components/FileUpload'

interface GroupsHeroProps {
  url: string
  onUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onAdd: () => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export const GroupsHero = ({ url, onUrlChange, onAdd, onFileUpload }: GroupsHeroProps) => {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-1.5">
        <PageTitle>Группы</PageTitle>
        <p className="max-w-2xl text-muted-foreground">
          Управляйте VK сообществами: добавляйте группы для парсинга, отслеживайте их метрики и
          аудиторию.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
        <GroupInput url={url} onUrlChange={onUrlChange} onAdd={onAdd} />
        <FileUpload onUpload={onFileUpload} buttonText="Импорт" className="shrink-0" />
      </div>
    </div>
  )
}
