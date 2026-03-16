import type { CommentsSearchResult } from '@/modules/comments/api/models/commentsSearch.model'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { EmptyState } from '@/shared/components/EmptyState'

interface CommentsSearchResultsProps {
  result: CommentsSearchResult | undefined
  isLoading: boolean
}

export default function CommentsSearchResults({ result, isLoading }: CommentsSearchResultsProps) {
  if (isLoading) {
    return (
      <Card className="border-white/10 bg-slate-900/30">
        <CardHeader>
          <CardTitle className="font-monitoring-display text-xl text-white">
            Поисковая выдача
          </CardTitle>
          <CardDescription className="text-slate-400">
            Выполняю поиск по комментариям и постам...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!result || result.items.length === 0) {
    return (
      <EmptyState
        title="Ничего не найдено"
        description="Попробуй изменить запрос или переключить режим выдачи."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span>Найдено: {result.total}</span>
        <Badge className="border-white/10 bg-slate-800/50 text-slate-300">
          {result.viewMode === 'posts' ? 'Посты' : 'Комментарии'}
        </Badge>
        <Badge className="border-white/10 bg-slate-800/50 text-slate-300">{result.source}</Badge>
      </div>

      {result.items.map((item) =>
        item.type === 'post' ? (
          <Card key={`search-post-${item.postId}`} className="border-white/10 bg-slate-900/30">
            <CardHeader>
              <CardTitle className="font-monitoring-display text-lg text-white">
                Пост #{item.postId}
              </CardTitle>
              <CardDescription className="whitespace-pre-wrap text-slate-300">
                {item.postText || 'Текст поста отсутствует'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.comments.map((comment) => (
                <div
                  key={`search-post-comment-${comment.commentId}`}
                  className="rounded-lg border border-white/10 bg-slate-950/40 p-3"
                >
                  <div className="mb-2 text-xs text-slate-500">
                    Комментарий #{comment.commentId}
                  </div>
                  <div className="whitespace-pre-wrap text-sm text-slate-200">
                    {comment.commentText}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card
            key={`search-comment-${item.commentId}`}
            className="border-white/10 bg-slate-900/30"
          >
            <CardHeader>
              <CardTitle className="font-monitoring-display text-lg text-white">
                Комментарий #{item.commentId}
              </CardTitle>
              <CardDescription className="text-slate-400">
                Пост #{item.postId ?? 'unknown'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="whitespace-pre-wrap text-sm text-slate-200">{item.commentText}</div>
              {item.postText ? (
                <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-400">
                  {item.postText}
                </div>
              ) : null}
              {item.highlight.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {item.highlight.map((chunk, index) => (
                    <Badge
                      key={`highlight-${item.commentId}-${index}`}
                      className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
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
}
