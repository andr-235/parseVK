import { useCallback } from 'react'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
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
        className="h-11 border-white/10 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 transition-all duration-200 sm:min-w-[280px] sm:flex-1"
      />
      <Button
        onClick={onAdd}
        className="group relative h-11 overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="relative flex items-center justify-center gap-2">
          <Plus className="size-4" />
          Добавить
        </span>
      </Button>
    </div>
  )
}

export default GroupInput
