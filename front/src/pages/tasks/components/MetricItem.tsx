import type { ReactNode } from 'react'

interface MetricItemProps {
  label: string
  value: ReactNode
}

export const MetricItem = ({ label, value }: MetricItemProps) => (
  <div>
    <p className="font-monitoring-body text-[10px] font-semibold uppercase tracking-wider text-text-secondary mb-0.5">
      {label}
    </p>
    <p className="font-mono-accent text-base font-semibold text-text-primary">{value}</p>
  </div>
)
