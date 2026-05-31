import { useState, useCallback } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '../../components/ui'
import { CommentsTable } from '../../components/widgets/comments/table/CommentsTable'
import { CommentDetail } from '../../components/widgets/comments/detail/CommentDetail'
import type { Comment } from '../../types/comments'

export function CommentsPage() {
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)

  const handleSelect = useCallback((c: Comment) => {
    setSelectedComment((prev) => (prev?.id === c.id ? null : c))
  }, [])

  const handleClose = useCallback(() => {
    setSelectedComment(null)
  }, [])

  const handleRetry = useCallback(() => {
    setQueryError(null)
  }, [])

  const selectedId = selectedComment?.id ?? null

  if (queryError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <AlertCircle size={40} className="text-danger" />
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Ошибка загрузки</h2>
          <p className="mt-1 text-sm text-text-secondary">{queryError}</p>
        </div>
        <Button variant="primary" size="md" onClick={handleRetry} aria-label="Повторить загрузку" icon={<RefreshCw size={16} />}>
          Повторить
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex flex-1 flex-col min-w-0 p-6">
        <h1 className="mb-6 text-lg font-semibold text-text-primary">Комментарии</h1>
        <CommentsTable
          onSelect={handleSelect}
          selectedId={selectedId}
          onError={setQueryError}
        />
      </div>
      {selectedComment && (
        <CommentDetail comment={selectedComment} onClose={handleClose} />
      )}
    </div>
  )
}
