import { Check, Search } from 'lucide-react'
import type { Group } from '@/shared/types'

interface CreateParseTaskModalGroupListProps {
  groups: Group[]
  selectedIds: Set<number | string>
  getDisplayName: (group: Group) => string
  onToggle: (groupId: number | string) => void
}

function CreateParseTaskModalGroupList({
  groups,
  selectedIds,
  getDisplayName,
  onToggle,
}: CreateParseTaskModalGroupListProps) {
  return (
    <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-1">
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background-primary/30 py-10 text-center">
          <Search aria-hidden="true" className="mb-2 h-6 w-6 text-text-secondary" />
          <h3 className="font-monitoring-body text-sm font-semibold text-text-light">
            РќРµ РЅР°С€Р»Рё РїРѕРґС…РѕРґСЏС‰РёС… РіСЂСѓРїРї
          </h3>
          <p className="font-monitoring-body text-xs text-text-secondary">
            РџРѕРїСЂРѕР±СѓР№С‚Рµ РёР·РјРµРЅРёС‚СЊ Р·Р°РїСЂРѕСЃ РёР»Рё СЃР±СЂРѕСЃРёС‚СЊ РїРѕРёСЃРє
          </p>
        </div>
      ) : (
        groups.map((group) => {
          const displayName = getDisplayName(group)
          const isChecked = selectedIds.has(group.vkId)

          return (
            <div
              key={group.vkId}
              role="button"
              tabIndex={0}
              onClick={() => onToggle(group.vkId)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onToggle(group.vkId)
                }
              }}
              className={`group flex cursor-pointer items-center gap-4 rounded-xl border p-3.5 transition-colors duration-200 hover:border-accent-primary/30 hover:bg-background-primary/40 ${
                isChecked
                  ? 'border-accent-primary/45 bg-accent-primary/5 text-text-light'
                  : 'border-border bg-background-primary/30'
              }`}
            >
              <div
                role="checkbox"
                aria-checked={isChecked}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                  isChecked
                    ? 'border-accent-primary bg-accent-primary'
                    : 'border-border bg-transparent group-hover:border-accent-primary'
                }`}
              >
                {isChecked && (
                  <Check className="h-3.5 w-3.5 text-background-secondary" strokeWidth={3} />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-monitoring-body text-sm font-medium text-text-light">
                  {displayName}
                </span>
                {group.vkId ? (
                  <span className="font-mono-accent text-xs text-text-secondary">
                    vk.com/club{group.vkId}
                  </span>
                ) : null}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

export default CreateParseTaskModalGroupList
