import type { ReactNode } from 'react'

interface MetricItemProps {
  label: string
  value: ReactNode
}

export const MetricItem = ({ label, value }: MetricItemProps) => (
  <div>
    <p className="mb-0.5 font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary">
      {label}
    </p>
    <p className="font-mono-accent text-base font-semibold text-text-primary">{value}</p>
  </div>
)
