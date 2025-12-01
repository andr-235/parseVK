import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'

interface EmptyCommentsStateProps {
  message: string
}

function EmptyCommentsState({ message }: EmptyCommentsStateProps) {
  return (
    <Empty role="status">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          💬
        </EmptyMedia>
        <EmptyTitle>Нет данных</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export default EmptyCommentsState
