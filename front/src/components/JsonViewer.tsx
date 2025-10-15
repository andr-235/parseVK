import { Fragment, type ReactNode } from 'react'

type JsonPrimitive = string | number | boolean | null

interface JsonViewerProps {
  value: unknown
}

const isPrimitive = (value: unknown): value is JsonPrimitive =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value)

const isPlainObject = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const formatPrimitive = (value: JsonPrimitive): string => {
  if (value === null) {
    return 'null'
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  return String(value)
}

const renderValue = (value: unknown, depth: number): ReactNode => {
  if (isPrimitive(value)) {
    return (
      <span className="font-mono text-sm text-text-primary/90 whitespace-pre-wrap">
        {formatPrimitive(value)}
      </span>
    )
  }

  if (Array.isArray(value)) {
    const arrayValue = value as unknown[]

    if (!arrayValue.length) {
      return (
        <span className="text-sm text-text-secondary/80">
          Пустой список
        </span>
      )
    }

    const primitivesOnly = arrayValue.every(isPrimitive)

    if (primitivesOnly) {
      return (
        <ul className="list-disc space-y-1 pl-5 text-sm text-text-primary/90">
          {arrayValue.map((item, index) => (
            <li
              key={`primitive-${depth}-${index}`}
              className="font-mono whitespace-pre-wrap"
            >
              {formatPrimitive(item as JsonPrimitive)}
            </li>
          ))}
        </ul>
      )
    }

    return (
      <div className="flex flex-col gap-3">
        {arrayValue.map((item, index) => (
          <div
            key={`array-${depth}-${index}`}
            className="flex flex-col gap-2 rounded-lg border border-border/40 bg-background-primary/60 p-3"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-text-secondary/70">
              Элемент {index + 1}
            </span>
            {renderValue(item, depth + 1)}
          </div>
        ))}
      </div>
    )
  }

  if (isPlainObject(value)) {
    const objectValue = value as Record<string, unknown>
    const entries = Object.entries(objectValue)

    if (!entries.length) {
      return (
        <span className="text-sm text-text-secondary/80">
          Пустой объект
        </span>
      )
    }

    return (
      <div className="flex flex-col gap-3">
        {entries.map(([key, nestedValue]) => (
          <div
            key={`${depth}-${key}`}
            className="flex flex-col gap-2 rounded-lg border border-border/40 bg-background-primary/60 p-3"
          >
            <span className="text-xs uppercase tracking-wide text-text-secondary/70">
              {key}
            </span>
            {renderValue(nestedValue, depth + 1)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <span className="text-sm text-text-secondary/80">
      Неподдерживаемое значение
    </span>
  )
}

const JsonViewer = ({ value }: JsonViewerProps) => (
  <Fragment>{renderValue(value, 0)}</Fragment>
)

export default JsonViewer
