import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import KeywordInput from '@/components/KeywordInput'
import FileUpload from '@/components/FileUpload'
import SectionCard from '@/components/SectionCard'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'

interface KeywordsActionsPanelProps {
  keywordValue: string
  setKeywordValue: Dispatch<SetStateAction<string>>
  categoryValue: string
  setCategoryValue: Dispatch<SetStateAction<string>>
  onAdd: () => Promise<void> | void
  onUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void> | void
}

function KeywordsActionsPanel({
  keywordValue,
  setKeywordValue,
  categoryValue,
  setCategoryValue,
  onAdd,
  onUpload,
}: KeywordsActionsPanelProps) {
  const handleKeywordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setKeywordValue(e.target.value)
  }

  const handleCategoryChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCategoryValue(e.target.value)
  }

  const handleAdd = () => {
    void onAdd()
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SectionCard
        title="Добавление ключевых слов"
        description="Введите слово или загрузите файл со списком. Категория необязательна."
        headerClassName="border-none pb-4"
        contentClassName="pt-0"
      >
        <div className="flex flex-col gap-3">
          <KeywordInput
            value={keywordValue}
            categoryValue={categoryValue}
            onChange={handleKeywordChange}
            onCategoryChange={handleCategoryChange}
            onAdd={handleAdd}
            placeholder="Поиск и добавление ключевого слова"
            categoryPlaceholder="Категория (необязательно)"
          />
          <FileUpload onUpload={onUpload} />
        </div>
      </SectionCard>

      <SectionCard title="Подсказки" headerClassName="border-none pb-4" contentClassName="pt-0">
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="-ml-2 px-2 text-text-secondary">
              <HelpCircle className="mr-2 size-4" />
              Показать рекомендации
              <ChevronDown className="ml-2 size-4 data-[state=open]:hidden" />
              <ChevronUp className="ml-2 hidden size-4 data-[state=open]:block" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <ul className="list-disc space-y-2 pl-5 text-sm text-text-secondary">
              <li>После импорта быстро просмотрите список и удалите дубликаты.</li>
              <li>Используйте короткие, понятные формулировки.</li>
              <li>Для удобства группируйте слова по темам.</li>
              <li>Формат файла: «слово; Категория» по строке.</li>
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </SectionCard>
    </div>
  )
}

export default KeywordsActionsPanel
