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
        className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-accent-primary/10 via-background-secondary to-background-secondary/95 shadow-[0_22px_55px_-28px_rgba(37,99,235,0.28)] transition-shadow duration-300 hover:shadow-[0_28px_70px_-30px_rgba(37,99,235,0.38)] supports-[backdrop-filter]:backdrop-blur-sm dark:from-white/10 dark:via-white/5 dark:to-white/[0.08]"
        headerClassName="hidden"
        contentClassName="px-4 py-4 md:px-5"
        hideHeader
      >
        <div className="relative isolate flex flex-col gap-4">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 -z-10 size-40 rounded-full bg-accent-primary/25 blur-3xl dark:bg-accent-primary/30"
          />
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
