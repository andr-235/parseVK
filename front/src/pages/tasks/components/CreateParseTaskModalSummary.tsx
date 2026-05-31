interface CreateParseTaskModalSummaryProps {
  selectedCount: number
  groupsCount: number
  filteredCount: number
  onSelectAll: () => void
  onDeselectAll: () => void
}

function CreateParseTaskModalSummary({
  selectedCount,
  groupsCount,
  filteredCount,
  onSelectAll,
  onDeselectAll,
}: CreateParseTaskModalSummaryProps) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-background-primary/30 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span className="font-monitoring-display text-3xl font-semibold tracking-tight text-accent-primary">
          {selectedCount}
        </span>
        <div className="flex flex-col">
          <span className="font-monitoring-body text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
            Р’С‹Р±СЂР°РЅРѕ РіСЂСѓРїРї
          </span>
          <span className="font-monitoring-body text-xs font-normal text-text-secondary">
            РёР·{' '}
            <span className="font-mono-accent text-xs font-medium text-text-light">
              {groupsCount}
            </span>{' '}
            РґРѕСЃС‚СѓРїРЅС‹С… вЂў РЅР°Р№РґРµРЅРѕ{' '}
            <span className="font-mono-accent text-xs font-medium text-text-light">
              {filteredCount}
            </span>
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSelectAll}
          type="button"
          className="rounded-lg border border-border bg-background-secondary/50 px-3 py-1.5 font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary transition-colors hover:bg-background-primary hover:text-text-light hover:border-accent-primary/50"
        >
          Р’С‹Р±СЂР°С‚СЊ РІСЃРµ
        </button>
        <button
          onClick={onDeselectAll}
          type="button"
          className="rounded-lg border border-transparent px-3 py-1.5 font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary/70 transition-colors hover:bg-background-primary hover:text-text-light"
        >
          РЎРЅСЏС‚СЊ РІС‹РґРµР»РµРЅРёРµ
        </button>
      </div>
    </section>
  )
}

export default CreateParseTaskModalSummary
