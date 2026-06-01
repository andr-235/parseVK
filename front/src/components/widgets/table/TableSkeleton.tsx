export function TableSkeleton() {
  return (
    <div className="flex flex-1 flex-col min-w-0">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-8 flex-1 max-w-xs animate-pulse rounded-md bg-bg-hover" />
        <div className="h-8 w-28 animate-pulse rounded-md bg-bg-hover" />
        <div className="h-8 w-28 animate-pulse rounded-md bg-bg-hover" />
        <div className="ml-auto h-8 w-24 animate-pulse rounded-md bg-bg-hover" />
      </div>
      <div className="min-w-0 overflow-x-auto rounded-lg border border-border bg-bg-main">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-sidebar">
              {Array.from({ length: 7 }).map((_, i) => (
                <th key={i} className="px-3 py-2"><div className="h-4 w-16 animate-pulse rounded bg-bg-hover" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-3 py-2"><div className="h-4 animate-pulse rounded bg-bg-hover" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
