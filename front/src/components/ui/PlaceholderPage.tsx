import { useNavigate } from 'react-router-dom'
import { LayoutGrid, ArrowLeft } from 'lucide-react'
import { Button } from './Button'

type PlaceholderPageProps = {
  title: string
  description?: string
}

export function PlaceholderPage({
  title,
  description = 'Этот раздел находится в разработке. Мы работаем над тем, чтобы предоставить вам полный функционал в ближайшее время.',
}: PlaceholderPageProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-fade-in">
      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-bg-panel text-text-muted mb-4">
        <LayoutGrid size={24} />
      </div>
      <h1 className="text-xl font-semibold text-text-primary mb-2">{title}</h1>
      <p className="max-w-[45ch] text-sm text-text-secondary mb-6 leading-relaxed">
        {description}
      </p>
      <Button
        variant="primary"
        size="md"
        onClick={() => navigate('/comments')}
        icon={<ArrowLeft size={16} />}
        aria-label="Вернуться к комментариям"
        autoFocus
      >
        Вернуться в комментарии
      </Button>
    </div>
  )
}
