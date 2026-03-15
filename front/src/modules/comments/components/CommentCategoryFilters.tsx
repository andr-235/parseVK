import { memo } from 'react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/utils'

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
    <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono-accent text-xs font-semibold uppercase tracking-wider text-slate-500">
            Категории
          </span>
          <Badge className="border-0 bg-slate-800/60 px-2 py-0.5 font-mono-accent text-[10px] text-slate-300">
            {categories.length}
          </Badge>
        </div>

        {selectedCategories.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 font-mono-accent text-xs text-slate-400 hover:bg-white/5 hover:text-white"
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
                  ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/10 hover:bg-cyan-500/20'
                  : 'border-white/10 bg-transparent text-slate-400 hover:border-white/20 hover:text-white'
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
