import { Check, Pencil, Shapes, Trash2, X } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import type { Keyword } from '@/types'
import { useEffect, useState } from 'react'

interface KeywordCardProps {
  keyword: Keyword
  categorySuggestions: string[]
  onDelete: (id: number) => void
  onManageForms: (keyword: Keyword) => void
  onUpdateCategory: (id: number, category?: string | null) => void | Promise<void>
}

export function KeywordCard({
  keyword,
  categorySuggestions,
  onDelete,
  onManageForms,
  onUpdateCategory,
}: KeywordCardProps) {
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [draftCategory, setDraftCategory] = useState(keyword.category ?? '')

  useEffect(() => {
    if (!isEditingCategory) {
      setDraftCategory(keyword.category ?? '')
    }
  }, [isEditingCategory, keyword.category])

  const handleSaveCategory = async () => {
    await onUpdateCategory(keyword.id, draftCategory)
    setIsEditingCategory(false)
  }

  const handleCancelCategory = () => {
    setDraftCategory(keyword.category ?? '')
    setIsEditingCategory(false)
  }

  return (
    <Card className="relative flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 z-10"
        onClick={() => onDelete(keyword.id)}
      >
        <Trash2 className="size-4" />
      </Button>

      <CardContent className="flex-1 p-3 pt-4 flex flex-col">
        <h3
          className="font-bold text-lg text-foreground truncate pr-8 mb-3 tracking-tight"
          title={keyword.word}
        >
          {keyword.word}
        </h3>

        <div className="space-y-2">
          {isEditingCategory ? (
            <>
              <Input
                aria-label="Категория слова"
                value={draftCategory}
                list={`keyword-card-categories-${keyword.id}`}
                onChange={(event) => setDraftCategory(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleSaveCategory()
                  }
                  if (event.key === 'Escape') {
                    handleCancelCategory()
                  }
                }}
                placeholder="Категория"
                className="h-8"
              />
              <datalist id={`keyword-card-categories-${keyword.id}`}>
                {categorySuggestions.map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
              <div className="flex gap-2">
                <Button size="sm" className="h-8 flex-1" onClick={() => void handleSaveCategory()}>
                  <Check className="size-4" />
                  Сохранить
                </Button>
                <Button variant="outline" size="sm" className="h-8" onClick={handleCancelCategory}>
                  <X className="size-4" />
                </Button>
              </div>
            </>
          ) : keyword.category ? (
            <Badge
              variant="secondary"
              className="w-fit text-xs font-normal px-2.5 py-0.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/10"
            >
              {keyword.category}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="w-fit text-xs font-normal text-muted-foreground border-muted-foreground/20 bg-transparent"
            >
              Без категории
            </Badge>
          )}
        </div>

        <div className="mt-auto pt-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 justify-center gap-2"
              onClick={() => setIsEditingCategory(true)}
              aria-label="Редактировать категорию"
            >
              <Pencil className="size-4" />
              Тег
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 justify-center gap-2"
              onClick={() => onManageForms(keyword)}
            >
              <Shapes className="size-4" />
              Формы
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
