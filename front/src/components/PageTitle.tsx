interface PageTitleProps {
  children: React.ReactNode
}

function PageTitle({ children }: PageTitleProps) {
  return <h1 className="text-3xl font-semibold tracking-tight text-text-primary">{children}</h1>
}

export default PageTitle
