type PageHeaderProps = {
  title: string
  description: string
  children?: React.ReactNode
}

const PageHeader = ({ title, description, children }: PageHeaderProps) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="space-y-1.5">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    {children}
  </div>
)

export default PageHeader
