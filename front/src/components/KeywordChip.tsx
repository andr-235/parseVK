import { X } from 'lucide-react'
import { motion } from 'framer-motion'

interface KeywordChipProps {
  id: number
  text: string
  onRemove: (id: number) => void | Promise<void>
}

function KeywordChip({ id, text, onRemove }: KeywordChipProps) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.18 }}
      className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background-secondary/70 px-3 py-1.5 text-sm text-text-primary shadow-soft-sm hover:border-primary/60"
    >
      <span className="leading-none">{text}</span>
      <button
        type="button"
        onClick={() => onRemove(id)}
        className="ml-1 grid size-5 place-items-center rounded-full bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
        aria-label={`Удалить слово ${text}`}
      >
        <X className="size-3.5" strokeWidth={3} />
      </button>
    </motion.li>
  )
}

export default KeywordChip

