import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import KeywordInput from '@/components/KeywordInput'
import FileUpload from '@/components/FileUpload'
import { Button } from '@/components/ui/button'
import SectionCard from '@/components/SectionCard'

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
    <div className="grid gap-4">
      <SectionCard
        title="Добавить новое слово"
        description="Категория — необязательно. Пример: “Акции”, “Спам”."
        contentClassName="pt-4"
      >
        <div className="relative isolate flex flex-col gap-4">
          <KeywordInput
            value={keywordValue}
            categoryValue={categoryValue}
            onChange={handleKeywordChange}
            onCategoryChange={handleCategoryChange}
            onAdd={handleAdd}
            placeholder="Поиск и добавление ключевого слова"
            categoryPlaceholder="Категория (необязательно)"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleAdd} className="min-w-28">
              Добавить
            </Button>
            <FileUpload onUpload={onUpload} />
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

export default KeywordsActionsPanel
