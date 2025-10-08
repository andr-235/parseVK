import Input from './Input'
import Button from './Button'

interface KeywordInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAdd: () => void | Promise<void>
  placeholder?: string
}

function KeywordInput({ value, onChange, onAdd, placeholder }: KeywordInputProps) {
  const handleAdd = () => {
    void onAdd()
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <Input
        value={value}
        onChange={onChange}
        onEnter={handleAdd}
        placeholder={placeholder}
        className="sm:min-w-[260px] sm:flex-1"
      />
      <Button onClick={handleAdd} className="w-full sm:w-auto">
        Добавить
      </Button>
    </div>
  )
}

export default KeywordInput
