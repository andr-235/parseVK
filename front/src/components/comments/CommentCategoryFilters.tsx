import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/common'

interface CommentCategoryFiltersProps {
  categories: string[]
  selectedCategories: string[]
  onToggleCategory: (category: string) => void
  onClear: () => void
}

export const CommentCategoryFilters = memo(function CommentCategoryFilters({
  categories,
  selectedCategories,
  onToggleCategory,
  onClear,
}: CommentCategoryFiltersProps) {
  if (categories.length === 0) {
    return null
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-background-secondary/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono-accent text-xs font-semibold uppercase tracking-wider text-text-secondary/70">
            Категории
          </span>
          <Badge className="border-0 bg-background-primary/50 px-2 py-0.5 font-mono-accent text-[10px] text-text-secondary">
            {categories.length}
          </Badge>
        </div>

        {selectedCategories.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 font-mono-accent text-xs text-text-secondary hover:bg-background-primary/40 hover:text-white"
            onClick={onClear}
          >
            Сбросить
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category)

          return (
            <Button
              key={category}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onToggleCategory(category)}
              className={cn(
                'h-8 rounded-full border px-3 font-mono-accent text-xs font-medium transition-all duration-200',
                isSelected
                  ? 'border-accent-info/20 bg-accent-info/10 text-accent-info hover:bg-accent-info/20'
                  : 'border-border/60 bg-transparent text-text-secondary hover:border-border hover:text-white'
              )}
            >
              {category}
            </Button>
          )
        })}
      </div>
    </div>
  )
})
