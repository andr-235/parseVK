import { useState, useCallback } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button, FeedbackToast } from '../../components/ui'
import { PageShell } from '../../components/layout/PageShell'
import { CommentsTable } from '../../components/widgets/table/CommentsTable'
import { CommentDetail } from '../../components/widgets/comments/detail/CommentDetail'
import { createWatchlistAuthor } from '../../shared/api/watchlist'
import { useFeedback } from '../../shared/hooks/useFeedback'
import type { Comment } from '../../types/comments'

export function CommentsPage() {
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { feedback, showFeedback, dismissFeedback } = useFeedback()

  const addToWatchlistMutation = useMutation({
    mutationFn: (commentId: number) => createWatchlistAuthor({ commentId }),
    onSuccess: (data) => {
      navigate(`/watchlist?selected=${data.id}`)
    },
    onError: (err) => {
      const errMsg = err instanceof Error ? err.message : String(err)
      if (errMsg.includes('409') || errMsg.includes('already')) {
        showFeedback('success', 'Этот автор уже на карандаше')
        setTimeout(() => {
          navigate('/watchlist')
        }, 1000)
      } else {
        showFeedback('error', `Не удалось добавить автора на карандаш: ${errMsg}`)
      }
    }
  })

  const handleAddToWatchlist = useCallback((commentId: number) => {
    addToWatchlistMutation.mutate(commentId)
  }, [addToWatchlistMutation])

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
    <PageShell
      title="Комментарии"
      sidebar={
        selectedComment && (
          <CommentDetail
            comment={selectedComment}
            onClose={handleClose}
            onAddToWatchlist={() => handleAddToWatchlist(selectedComment.id)}
            isAddingToWatchlist={addToWatchlistMutation.isPending}
          />
        )
      }
    >
      <CommentsTable
        onSelect={handleSelect}
        selectedId={selectedId}
        onError={setQueryError}
        onAddToWatchlist={handleAddToWatchlist}
      />
      <FeedbackToast feedback={feedback} onDismiss={dismissFeedback} />
    </PageShell>
  )
}
