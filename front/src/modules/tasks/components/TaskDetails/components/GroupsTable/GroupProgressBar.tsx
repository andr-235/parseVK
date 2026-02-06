import type { ReactNode } from 'react'
import ProgressBar from '@/shared/components/ProgressBar'
import { clamp } from '../../utils/progressCalculations'

interface GroupProgressBarProps {
  tone: 'primary' | 'success' | 'warning' | 'danger'
  currentValue: number
  totalValue: number
  labelText: string
  detail: ReactNode
  indeterminate?: boolean
}

export const GroupProgressBar = ({
  tone,
  currentValue,
  totalValue,
  labelText,
  detail,
  indeterminate = false,
}: GroupProgressBarProps) => {
  const safeTotal = totalValue > 0 ? totalValue : 1
  const safeCurrent = clamp(currentValue, 0, safeTotal)

  return (
    <div className="w-full max-w-[240px] space-y-1.5">
      <ProgressBar
        current={indeterminate ? 1 : safeCurrent}
        total={indeterminate ? 1 : safeTotal}
        size="small"
        tone={tone}
        showLabel={false}
        indeterminate={indeterminate}
        className="h-1.5"
      />
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{labelText}</span>
        {detail}
      </div>
    </div>
  )
}
