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
    <div className="keyword-input-group">
      <Input
        value={value}
        onChange={onChange}
        onEnter={handleAdd}
        placeholder={placeholder}
      />
      <Button onClick={handleAdd}>Добавить</Button>
    </div>
  )
}

export default KeywordInput
