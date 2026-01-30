import { useMemo, useState, useCallback } from 'react'
import { Button } from '../shared/ui/button'
import { cn } from '@/lib/utils'

interface ExpandableTextProps {
  text: string
  maxLength?: number
  className?: string
}

export function ExpandableText({ text, maxLength = 100, className }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const needsExpansion = useMemo(() => {
    return Boolean(text && text.length > maxLength)
  }, [text, maxLength])

  const displayText = useMemo(() => {
    if (!needsExpansion) return text || '-'
    return isExpanded ? text : `${text.slice(0, maxLength)}...`
  }, [text, maxLength, isExpanded, needsExpansion])

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  if (!needsExpansion) {
    return <span className={className}>{displayText}</span>
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="whitespace-pre-wrap break-words">{displayText}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleExpanded}
        className="w-fit text-xs text-primary hover:text-primary/80"
      >
        {isExpanded ? 'Свернуть' : 'Развернуть'}
      </Button>
    </div>
  )
}
