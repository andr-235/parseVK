interface PageTitleProps {
  children: React.ReactNode
}

function PageTitle({ children }: PageTitleProps) {
  return <h1>{children}</h1>
}

export default PageTitle
