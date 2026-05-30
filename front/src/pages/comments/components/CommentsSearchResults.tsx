import { memo } from 'react'
import type { CommentsSearchResult } from '@/pages/comments/api/models/commentsSearch.model'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { Spinner } from '@/shared/components/ui/spinner'
import { Search } from 'lucide-react'

interface CommentsSearchResultsProps {
  result: CommentsSearchResult | undefined
  isLoading: boolean
}

const CommentsSearchResults = memo(function CommentsSearchResults({ result, isLoading }: CommentsSearchResultsProps) {
  if (isLoading) {
    return (
      <Card className="border-border/40 bg-background-secondary/30">
        <CardHeader>
          <CardTitle className="font-monitoring-display text-xl text-text-light">
            Поисковая выдача
          </CardTitle>
          <CardDescription className="text-text-secondary">
            <span className="inline-flex items-center gap-2">
              <Spinner className="size-3.5" />
              Выполняю поиск по комментариям и постам...
            </span>
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!result || result.items.length === 0) {
    return (
      <EmptyState
        icon={<Search className="w-8 h-8" />}
        title="Ничего не найдено"
        description="Попробуйте изменить запрос или переключить режим выдачи."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="font-mono-accent text-xs text-text-secondary">
          Найдено: {result.total}
        </span>
        <Badge className="border-border/60 bg-background-secondary font-mono-accent text-[10px] text-text-secondary">
          {result.viewMode === 'posts' ? 'Посты' : 'Комментарии'}
        </Badge>
        <Badge className="border-border/60 bg-background-secondary font-mono-accent text-[10px] text-text-secondary">
          {result.source}
        </Badge>
      </div>

      {result.items.map((item) =>
        item.type === 'post' ? (
          <Card key={`search-post-${item.postId}`} className="border-border/40 bg-background-secondary/30">
            <CardHeader>
              <CardTitle className="font-monitoring-display text-lg text-text-light">
                Пост #{item.postId}
              </CardTitle>
              <CardDescription className="whitespace-pre-wrap text-text-primary">
                {item.postText || 'Текст поста отсутствует'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.comments.map((comment) => (
                <div
                  key={`search-post-comment-${comment.commentId}`}
                  className="rounded-lg border border-border/40 bg-background-primary/40 p-3"
                >
                  <div className="mb-2 font-mono-accent text-[10px] text-text-secondary/70">
                    Комментарий #{comment.commentId}
                  </div>
                  <div className="whitespace-pre-wrap font-monitoring-body text-sm text-text-primary">
                    {comment.commentText}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card
            key={`search-comment-${item.commentId}`}
            className="border-border/40 bg-background-secondary/30"
          >
            <CardHeader>
              <CardTitle className="font-monitoring-display text-lg text-text-light">
                Комментарий #{item.commentId}
              </CardTitle>
              <CardDescription className="text-text-secondary">
                Пост #{item.postId ?? 'unknown'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="whitespace-pre-wrap font-monitoring-body text-sm text-text-primary">
                {item.commentText}
              </div>
              {item.postText ? (
                <div className="rounded-lg border border-border/40 bg-background-primary/40 p-3 font-monitoring-body text-sm text-text-secondary">
                  {item.postText}
                </div>
              ) : null}
              {item.highlight.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {item.highlight.map((chunk, index) => (
                    <Badge
                      key={`highlight-${item.commentId}-${index}`}
                      className="border-accent-primary/30 bg-accent-primary/10 text-accent-primary font-mono-accent text-[10px]"
                    >
                      {chunk.replace(/<[^>]+>/g, '')}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
})

export default CommentsSearchResults
