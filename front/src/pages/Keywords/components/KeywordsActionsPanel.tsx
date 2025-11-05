import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import KeywordInput from '@/components/KeywordInput'
import FileUpload from '@/components/FileUpload'
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
    <div className="grid gap-4 md:grid-cols-2">
      <SectionCard
        title="Добавление ключевых слов"
        description="Введите слово вручную или загрузите готовый список. Категорию можно оставить пустой — в этом случае слово попадёт в общий раздел."
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

      <SectionCard
        title="Советы по работе"
        headerClassName="border-none pb-4"
        contentClassName="pt-0"
      >
        <ul className="list-disc space-y-2 pl-5 text-sm text-text-secondary">
          <li>Проверяйте список после импорта, чтобы удалить дубликаты.</li>
          <li>Используйте короткие и понятные формулировки.</li>
          <li>Добавляйте ключевые слова по темам для разных сценариев.</li>
          <li>Если загрузить файл с уже существующими словами и новыми категориями, записи обновятся автоматически.</li>
          <li>В файле указывайте каждое слово с новой строки. Можно добавить категорию через точку с запятой: «ключевое слово; Категория».</li>
        </ul>
      </SectionCard>
    </div>
  )
}

export default KeywordsActionsPanel
