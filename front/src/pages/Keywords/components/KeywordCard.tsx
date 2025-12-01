import { Trash2 } from 'lucide-react'
import { Card, CardContent, CardFooter } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import type { Keyword } from '../../../types'

interface KeywordCardProps {
  keyword: Keyword
  onDelete: (id: number) => void
}

export function KeywordCard({ keyword, onDelete }: KeywordCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="flex-1 p-3 flex flex-col gap-2">
        <h3 className="font-semibold text-sm text-foreground truncate" title={keyword.word}>
          {keyword.word}
        </h3>
        
        {keyword.category ? (
          <Badge variant="secondary" className="w-fit bg-muted/50 text-xs font-normal">
            {keyword.category}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground italic">Без категории</span>
        )}
      </CardContent>

      <CardFooter className="p-2 pt-2 bg-muted/5 flex items-center justify-end gap-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
          onClick={() => onDelete(keyword.id)}
        >
          <Trash2 className="size-3" />
        </Button>
      </CardFooter>
    </Card>
  )
}

