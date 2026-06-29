import type { ReactNode } from 'react'

type FormFieldProps = {
  label: string
  children: ReactNode
}

type CheckboxGroupProps = {
  title: string
  items: string[]
  selected?: string[]
  disabled?: boolean
  onToggle?: (item: string) => void
}

export function FormField({ label, children }: FormFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</span>
      {children}
    </label>
  )
}

export function CheckboxGroup({ title, items, selected, disabled = false, onToggle }: CheckboxGroupProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">{title}</p>
      <div className="flex max-w-3xl flex-wrap gap-2 rounded-md border border-border bg-bg-main p-3">
        {items.map((item) => (
          <label key={item} className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-bg-panel px-3 py-2 text-xs text-text-secondary transition-colors duration-150 hover:border-accent/40">
            <input
              type="checkbox"
              checked={selected ? selected.includes(item) : true}
              disabled={disabled || !onToggle}
              readOnly={!onToggle}
              onChange={() => onToggle?.(item)}
              className="accent-accent"
            />
            {item}
          </label>
        ))}
      </div>
    </div>
  )
}

export function FormatGroup() {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">Форматы файлов</p>
      <div className="flex flex-wrap gap-3">
        {['XLSX', 'DOCX', 'JSON'].map((format) => (
          <label key={format} className="flex items-center gap-2 rounded-md border border-border bg-bg-main px-4 py-2 text-sm text-text-secondary">
            <input type="checkbox" checked={format === 'XLSX'} disabled readOnly className="accent-accent" />
            {format}
          </label>
        ))}
      </div>
    </div>
  )
}
