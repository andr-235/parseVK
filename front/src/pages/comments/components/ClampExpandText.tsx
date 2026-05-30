import { memo } from 'react'
import { cn } from '@/shared/utils'
import { highlightKeywords } from '@/shared/utils/highlightKeywords'
import type { Keyword } from '@/shared/types'

interface ClampExpandTextProps {
  text: string
  keywords: Keyword[]
  isExpanded: boolean
  onToggle: () => void
  labelExpanded: string
  labelCollapsed: string
  lineClamp?: number
  className?: string
}

export const ClampExpandText = memo(function ClampExpandText({
  text,
  keywords,
  isExpanded,
  onToggle,
  labelExpanded,
  labelCollapsed,
  lineClamp = 4,
  className,
}: ClampExpandTextProps) {
  return (
    <button
      type="button"
      aria-expanded={isExpanded}
      aria-label={isExpanded ? labelExpanded : labelCollapsed}
      className={cn(
        'w-full cursor-pointer whitespace-pre-wrap break-words text-left font-monitoring-body text-sm leading-relaxed text-text-primary transition-colors hover:text-white',
        !isExpanded && 'line-clamp-4',
        className
      )}
      style={!isExpanded ? { WebkitLineClamp: lineClamp } : undefined}
      onClick={onToggle}
    >
      {highlightKeywords(text, keywords)}
    </button>
  )
})
