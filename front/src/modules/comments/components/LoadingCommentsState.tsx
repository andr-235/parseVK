import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

function LoadingCommentsState() {
  return (
    <Card
      className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-[20px] bg-background-primary p-10 text-center text-text-secondary md:p-12 border-0"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner className="h-12 w-12" />
      <p className="font-semibold text-text-primary">Загружаем комментарии…</p>
    </Card>
  )
}

export default LoadingCommentsState
