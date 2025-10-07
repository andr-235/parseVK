import { useMemo } from "react"

interface ProgressBarProps {
  current: number
  total: number
  label?: string
  showLabel?: boolean
  size?: 'default' | 'small'
  tone?: 'primary' | 'success' | 'warning' | 'danger'
  className?: string
  indeterminate?: boolean
}

const clampPercentage = (value: number): number => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0
  }

  if (value < 0) {
    return 0
  }

  if (value > 100) {
    return 100
  }

  return value
}

function ProgressBar({
  current,
  total,
  label,
  showLabel = true,
  size = 'default',
  tone = 'primary',
  className,
  indeterminate = false
}: ProgressBarProps) {
  const percentage = useMemo(() => {
    const safeTotal = total > 0 ? total : 0
    const safeCurrent = current > 0 ? current : 0
    return safeTotal > 0 ? clampPercentage((safeCurrent / safeTotal) * 100) : 0
  }, [current, total])

  const formattedLabel = useMemo(() => label ?? `${Math.round(percentage)}%`, [label, percentage])

  return (
    <div className={`progress-bar progress-bar--${size} progress-bar--${tone}${className ? ` ${className}` : ''}`}>
      <div className="progress-bar__track">
        <div
          className={`progress-bar__fill${indeterminate ? ' progress-bar__fill--indeterminate' : ''}`}
          style={indeterminate ? undefined : { width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="progress-bar__label">
          {formattedLabel}
        </div>
      )}
    </div>
  )
}

export default ProgressBar
