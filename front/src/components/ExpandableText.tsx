import { useState } from 'react'
import { Button } from './ui/button'

interface ExpandableTextProps {
  text: string
  maxLength?: number
  className?: string
}

export function ExpandableText({ text, maxLength = 100, className = '' }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text || text.length <= maxLength) {
    return <span className={className}>{text || '-'}</span>
  }

  const displayText = isExpanded ? text : `${text.slice(0, maxLength)}...`

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <span className="whitespace-pre-wrap break-words">{displayText}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-fit text-xs text-primary hover:text-primary/80"
      >
        {isExpanded ? 'Свернуть' : 'Развернуть'}
      </Button>
    </div>
  )
}
