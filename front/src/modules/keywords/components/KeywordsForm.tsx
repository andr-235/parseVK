import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { Plus, RefreshCw } from 'lucide-react'
import FileUpload from '@/shared/components/FileUpload'
import type { ChangeEvent } from 'react'

interface KeywordsFormProps {
  keywordValue: string
  categoryValue: string
  phraseValue: string
  isRecalculating: boolean
  onKeywordChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onPhraseChange: (value: string) => void
  onAdd: () => void
  onAddPhrase: () => void
  onRecalculate: () => void
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void
}

export const KeywordsForm = ({
  keywordValue,
  categoryValue,
  phraseValue,
  isRecalculating,
  onKeywordChange,
  onCategoryChange,
  onPhraseChange,
  onAdd,
  onAddPhrase,
  onRecalculate,
  onFileUpload,
}: KeywordsFormProps) => {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
          <div className="w-full sm:w-[200px]">
            <Input
              placeholder="Категория (опц.)"
              value={categoryValue}
              onChange={(e) => onCategoryChange(e.target.value)}
            />
          </div>
          <div className="flex flex-1 gap-2 sm:w-auto">
            <Input
              placeholder="Ключевое слово"
              value={keywordValue}
              onChange={(e) => onKeywordChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAdd()}
              className="flex-1 sm:w-[240px]"
            />
            <Button onClick={onAdd}>
              <Plus className="mr-2 size-4" />
              Добавить
            </Button>
          </div>
        </div>

        <div className="flex w-full items-center gap-3 lg:w-auto">
          <Button
            variant="outline"
            onClick={onRecalculate}
            disabled={isRecalculating}
            className="flex-1 lg:flex-none"
          >
            <RefreshCw className={`mr-2 size-4 ${isRecalculating ? 'animate-spin' : ''}`} />
            Пересчитать
          </Button>
          <FileUpload onUpload={onFileUpload} buttonText="Импорт" className="flex-1 lg:flex-none" />
        </div>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder="Фраза для поиска"
            value={phraseValue}
            onChange={(e) => onPhraseChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAddPhrase()}
            className="flex-1 sm:flex-none sm:w-[320px]"
          />
          <Button onClick={onAddPhrase}>
            <Plus className="mr-2 size-4" />
            Добавить фразу
          </Button>
        </div>
      </div>
    </div>
  )
}
