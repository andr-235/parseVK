import { type ReactNode, useMemo } from 'react'

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function intersectRanges(ranges: [number, number][]): [number, number][] {
  if (ranges.length === 0) return []
  const sorted = [...ranges].sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = [sorted[0]]
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1]
    if (sorted[i][0] <= last[1]) {
      last[1] = Math.max(last[1], sorted[i][1])
    } else {
      merged.push(sorted[i])
    }
  }
  return merged
}

type HighlightedTextProps = {
  text: string
  keywords: string[]
}

export function HighlightedText({ text, keywords }: HighlightedTextProps) {
  const parts = useMemo<ReactNode[]>(() => {
    if (!keywords || !keywords.length) return [text]

    const pattern = keywords
      .filter(Boolean)
      .map((kw) => `(${escapeRegex(kw)})`)
      .join('|')

    if (!pattern) return [text]

    const regex = new RegExp(pattern, 'giu')
    const ranges: [number, number][] = []
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      ranges.push([match.index, match.index + match[0].length])
    }

    if (!ranges.length) return [text]

    const merged = intersectRanges(ranges)
    const result: ReactNode[] = []
    let lastEnd = 0

    for (const [start, end] of merged) {
      if (start > lastEnd) {
        result.push(text.slice(lastEnd, start))
      }
      result.push(
        <mark key={start} className="bg-yellow-200 text-inherit rounded-sm px-0.5">
          {text.slice(start, end)}
        </mark>,
      )
      lastEnd = end
    }

    if (lastEnd < text.length) {
      result.push(text.slice(lastEnd))
    }

    return result
  }, [text, keywords])

  return <>{parts}</>
}
