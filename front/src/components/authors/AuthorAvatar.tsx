import { User } from 'lucide-react'
import type { Author } from '../../shared/api/authors'

export function AuthorAvatar({ author }: { author: Author }) {
  if (author.photo50) {
    return (
      <img
        src={author.photo50}
        alt=""
        className="h-8 w-8 rounded-full object-cover"
        loading="lazy"
      />
    )
  }
  return (
    <span
      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-bg-hover text-text-muted"
      aria-label="Аватар отсутствует"
    >
      <User size={14} />
    </span>
  )
}
