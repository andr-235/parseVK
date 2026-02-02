import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/utils'

interface ProgressBarProps {
  current: number
  total: number
  label?: string
  showLabel?: boolean
  size?: 'default' | 'small'
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
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
    gradient: 'from-cyan-500 to-blue-500',
    glow: 'shadow-cyan-500/25',
  },
  success: {
    gradient: 'from-green-500 to-emerald-500',
    glow: 'shadow-green-500/25',
  },
  warning: {
    gradient: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/25',
  },
  danger: {
    gradient: 'from-red-500 to-rose-500',
    glow: 'shadow-red-500/25',
  },
  info: {
    gradient: 'from-sky-500 to-blue-500',
    glow: 'shadow-sky-500/25',
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

  const toneStyle = useMemo(() => TONE_STYLES[tone], [tone])

  return (
    <div className={cn('flex flex-col', showLabel && 'gap-2', className)}>
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-full border border-white/10 bg-slate-900/50 backdrop-blur-sm',
          size === 'small' ? 'h-2' : 'h-3'
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : Math.round(percentage)}
        aria-label={label ?? `Progress: ${Math.round(percentage)}%`}
        aria-busy={indeterminate}
      >
        {indeterminate ? (
          <motion.div
            className={cn(
              'absolute top-0 h-full rounded-full bg-gradient-to-r shadow-lg',
              toneStyle.gradient,
              toneStyle.glow
            )}
            style={{ width: '30%' }}
            animate={{
              left: ['-30%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ) : (
          <motion.div
            className={cn(
              'absolute left-0 top-0 h-full rounded-full bg-gradient-to-r shadow-lg',
              toneStyle.gradient,
              toneStyle.glow
            )}
            style={{ width: `${percentage}%` }}
            transition={{
              duration: 0.8,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        )}
      </div>
      {showLabel && (
        <motion.div
          className="font-mono-accent text-xs text-slate-400"
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
