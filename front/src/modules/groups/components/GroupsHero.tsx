import GroupInput from '@/modules/groups/components/GroupInput'
import FileUpload from '@/shared/components/FileUpload'

interface GroupsHeroProps {
  url: string
  onUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onAdd: () => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export const GroupsHero = ({ url, onUrlChange, onAdd, onFileUpload }: GroupsHeroProps) => {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2.5">
        <h1 className="font-monitoring-display text-3xl font-bold tracking-tight text-white">
          VK <span className="text-cyan-400">Группы</span>
        </h1>
        <p className="max-w-2xl text-slate-300 font-monitoring-body">
          Управляйте VK сообществами: добавляйте группы для парсинга, отслеживайте их метрики и
          аудиторию.
        </p>
        {/* Decorative line */}
        <div className="h-px w-16 bg-gradient-to-r from-cyan-400/50 via-cyan-400/80 to-transparent" />
      </div>

      <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
        <GroupInput url={url} onUrlChange={onUrlChange} onAdd={onAdd} />
        <FileUpload onUpload={onFileUpload} buttonText="Импорт" className="shrink-0" />
      </div>
    </div>
  )
}
