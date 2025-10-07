import Input from './Input'
import Button from './Button'

interface GroupInputProps {
  url: string
  onUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAdd: () => void
}

function GroupInput({ url, onUrlChange, onAdd }: GroupInputProps) {
  return (
    <div className="keyword-input-group">
      <Input
        value={url}
        onChange={onUrlChange}
        onEnter={onAdd}
        placeholder="URL группы"
      />
      <Button onClick={onAdd}>Добавить</Button>
    </div>
  )
}

export default GroupInput
