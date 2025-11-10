import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PageTitleProps {
  children: React.ReactNode
  className?: string
}

function PageTitle({ children, className }: PageTitleProps) {
  return (
    <Card className="border-none shadow-none bg-transparent p-0 m-0">
      <CardHeader className="px-0 py-0">
        <CardTitle className={cn("text-3xl", className)}>{children}</CardTitle>
      </CardHeader>
    </Card>
  )
}

export default PageTitle
