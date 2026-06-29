import type { ReactNode, RefObject } from 'react'
import type { FriendsExportStreamState } from '../../../shared/hooks/useFriendsExportStream'
import { ExportResultsPanel } from './ExportResultsPanel'
import { ExportStatusPanel } from './ExportStatusPanel'

type ExportWorkspaceProps = {
  description: string
  form: ReactNode
  stream: FriendsExportStreamState
  logEndRef: RefObject<HTMLDivElement | null>
  onDownload: () => void
  onReset: () => void
}

export function ExportWorkspace({
  description,
  form,
  stream,
  logEndRef,
  onDownload,
  onReset,
}: ExportWorkspaceProps) {
  return (
    <div className="w-full space-y-5">
      <p className="border-b border-border pb-5 text-sm text-text-muted">{description}</p>

      <section className="rounded-lg border border-border bg-bg-panel">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-medium text-text-primary">Параметры экспорта</h2>
        </div>
        <div className="p-5">{form}</div>
      </section>

      <ExportStatusPanel stream={stream} logEndRef={logEndRef} />

      <ExportResultsPanel
        stream={stream}
        onDownload={onDownload}
        onReset={onReset}
      />
    </div>
  )
}
