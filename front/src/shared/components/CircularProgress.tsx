import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/utils'

interface CircularProgressProps {
  current: number
  total: number
  label?: string
  indeterminate?: boolean
  className?: string
  size?: number
}

const clampPercentage = (value: number): number => {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

const STROKE_WIDTH = 8
const DEFAULT_SIZE = 180

function CircularProgress({
  current,
  total,
  label,
  indeterminate = false,
  className,
  size = DEFAULT_SIZE,
}: CircularProgressProps) {
  const percentage = useMemo(() => {
    const safeTotal = total > 0 ? total : 0
    const safeCurrent = current > 0 ? current : 0
    return safeTotal > 0 ? clampPercentage((safeCurrent / safeTotal) * 100) : 0
  }, [current, total])

  const r = (size - STROKE_WIDTH) / 2
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - percentage / 100)

  return (
    <div
      className={cn('flex flex-col items-center gap-3', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(percentage)}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            className="text-border/60"
          />
          {indeterminate ? (
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={circumference * 0.25}
              className="text-accent-primary"
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: -circumference }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ) : (
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="text-accent-primary"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            />
          )}
        </svg>
        {!indeterminate && (
          <div
            className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-text-primary"
            style={{ fontSize: size * 0.18 }}
          >
            {total > 0 ? `${Math.round(percentage)}%` : '0%'}
          </div>
        )}
      </div>
      {label && <span className="text-sm font-medium text-text-secondary">{label}</span>}
    </div>
  )
}

export default CircularProgress
