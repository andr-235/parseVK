interface PageTitleProps {
  children: React.ReactNode
  description?: string
}

function PageTitle({ children, description }: PageTitleProps) {
  return (
    <div className="flex flex-col gap-6 md:gap-7">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">{children}</h1>
        {description && (
          <p className="max-w-[640px] text-base leading-relaxed text-text-secondary">{description}</p>
        )}
      </div>
    </div>
  )
}

export default PageTitle
