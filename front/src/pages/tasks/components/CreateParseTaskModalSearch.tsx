import { Search } from 'lucide-react'

interface CreateParseTaskModalSearchProps {
  value: string
  onChange: (value: string) => void
}

function CreateParseTaskModalSearch({ value, onChange }: CreateParseTaskModalSearchProps) {
  return (
    <div className="relative">
      <Search
        aria-hidden="true"
        className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary"
      />
      <input
        type="text"
        aria-label="РџРѕРёСЃРє РіСЂСѓРїРї"
        className="w-full rounded-xl border border-border bg-background-primary py-3 pl-12 pr-4 font-monitoring-body text-sm font-normal text-text-light placeholder:text-text-secondary focus:border-accent-primary/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/10"
        placeholder="РџРѕРёСЃРє РїРѕ РЅР°Р·РІР°РЅРёСЋ, СЃСЃС‹Р»РєРµ РёР»Рё ID"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

export default CreateParseTaskModalSearch
