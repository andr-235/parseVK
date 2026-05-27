import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface GroupInputProps {
  url: string
  onUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAdd: () => void
}

function GroupInput({ url, onUrlChange, onAdd }: GroupInputProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onAdd()
      }
    },
    [onAdd]
  )

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <Input
        value={url}
        onChange={onUrlChange}
        onKeyDown={handleKeyDown}
        placeholder="https://vk.com/группа"
        className="h-11 border-border bg-background-secondary text-text-light placeholder:text-text-secondary focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 sm:min-w-[280px] sm:flex-1"
      />
      <Button
        onClick={onAdd}
        className="h-11 bg-primary px-5 font-semibold text-text-light hover:bg-primary/90 transition-all duration-200 active:translate-y-px shadow-soft-sm hover:shadow-soft-md w-full sm:w-auto"
      >
        <span className="flex items-center justify-center gap-2">
          <Plus className="size-4" />
          Добавить
        </span>
      </Button>
    </div>
  )
}

export default GroupInput
