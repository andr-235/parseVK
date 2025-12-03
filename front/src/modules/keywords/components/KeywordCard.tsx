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

      <CardContent className="flex-1 p-3 pt-4 flex flex-col">
        <h3 className="font-bold text-lg text-foreground truncate pr-8 mb-3 tracking-tight" title={keyword.word}>
          {keyword.word}
        </h3>

        {keyword.category ? (
          <Badge variant="secondary" className="w-fit bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 border-blue-500/20 text-xs font-medium px-2.5 py-0.5">
            {keyword.category}
          </Badge>
        ) : (
          <Badge variant="outline" className="w-fit text-xs font-normal text-muted-foreground border-muted-foreground/30">
            Без категории
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
