import {Input} from './ui/input'
import {Button} from './ui/button'

interface GroupInputProps {
  url: string
  onUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAdd: () => void
}

function GroupInput({ url, onUrlChange, onAdd }: GroupInputProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <Input
        value={url}
        onChange={onUrlChange}
        onKeyDown={onAdd}
        placeholder="URL группы"
        className="sm:min-w-[260px] sm:flex-1"
      />
      <Button onClick={onAdd} className="w-full sm:w-auto">
        Добавить
      </Button>
    </div>
  )
}

export default GroupInput
