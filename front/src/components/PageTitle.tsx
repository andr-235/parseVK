import { Card, CardHeader, CardTitle } from '@/components/ui/card'

interface PageTitleProps {
  children: React.ReactNode
}

function PageTitle({ children}: PageTitleProps) {
  return (
    <Card className="border-none shadow-none bg-transparent p-0 m-0">
      <CardHeader className="px-0 py-0">
        <CardTitle className="text-3xl">{children}</CardTitle>
      </CardHeader>
    </Card>
  )
}

export default PageTitle
