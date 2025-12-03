import { Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Keyword } from '@/types'

interface KeywordCardProps {
  keyword: Keyword
  onDelete: (id: number) => void
}

export function KeywordCard({ keyword, onDelete }: KeywordCardProps) {
  return (
    <Card className="relative flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 z-10"
        onClick={() => onDelete(keyword.id)}
      >
        <Trash2 className="size-4" />
      </Button>

      <CardContent className="flex-1 p-3 pt-4 flex flex-col gap-4">
        <h3 className="font-semibold text-base text-foreground truncate pr-8" title={keyword.word}>
          {keyword.word}
        </h3>

        {keyword.category ? (
          <Badge variant="outline" className="w-fit text-xs font-normal">
            {keyword.category}
          </Badge>
        ) : (
          <Badge variant="outline" className="w-fit text-xs font-normal text-muted-foreground">
            Без категории
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
