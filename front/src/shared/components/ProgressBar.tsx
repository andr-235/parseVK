import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

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
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

const TONE_STYLES = {
  primary: {
    className: 'bg-accent-primary',
    color: '#3b82f6',
  },
  success: {
    className: 'bg-accent-success',
    color: '#22c55e',
  },
  warning: {
    className: 'bg-accent-warning',
    color: '#f59e0b',
  },
  danger: {
    className: 'bg-accent-danger',
    color: '#ef4444',
  },
} as const

function ProgressBar({
  current,
  total,
  label,
  showLabel = true,
  size = 'default',
  tone = 'primary',
  className,
  indeterminate = false,
}: ProgressBarProps) {
  const percentage = useMemo(() => {
    const safeTotal = total > 0 ? total : 0
    const safeCurrent = current > 0 ? current : 0
    return safeTotal > 0 ? clampPercentage((safeCurrent / safeTotal) * 100) : 0
  }, [current, total])

  const formattedLabel = useMemo(() => label ?? `${Math.round(percentage)}%`, [label, percentage])

  const toneStyle = TONE_STYLES[tone]

  return (
    <div className={cn('flex flex-col gap-2', size === 'small' ? 'text-xs' : 'text-sm', className)}>
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-full border border-border/60 bg-background-secondary/70',
          size === 'small' ? 'h-2.5' : 'h-3.5'
        )}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percentage)}
        role="progressbar"
      >
        {indeterminate ? (
          <motion.div
            className={cn('absolute left-0 top-0 h-full rounded-full', toneStyle.className)}
            style={{ backgroundColor: toneStyle.color }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              repeatType: 'reverse',
            }}
          />
        ) : (
          <motion.div
            className={cn('absolute left-0 top-0 h-full rounded-full', toneStyle.className)}
            style={{ backgroundColor: toneStyle.color }}
            initial={{ width: '0%' }}
            animate={{ width: `${percentage}%` }}
            transition={{
              duration: 0.8,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        )}
      </div>
      {showLabel && (
        <motion.div
          className="font-medium text-text-secondary"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {formattedLabel}
        </motion.div>
      )}
    </div>
  )
}

export default ProgressBar
