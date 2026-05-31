import { Search } from 'lucide-react'

interface CreateParseTaskModalSearchProps {
  value: string
  onChange: (value: string) => void
}

function CreateParseTaskModalSearch({ value, onChange }: CreateParseTaskModalSearchProps) {
  return (
    <label className="block">
      <span className="sr-only">Поиск групп</span>
      <span className="relative block">
        <Search
          aria-hidden="true"
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary"
        />
        <input
          type="text"
          className="h-11 w-full rounded-card border border-border/70 bg-background-primary py-3 pl-12 pr-4 font-monitoring-body text-sm font-normal text-text-light placeholder:text-text-secondary outline-none focus:border-accent-primary/50 focus:ring-2 focus:ring-accent-primary/20"
          placeholder="Поиск по названию, ссылке или ID"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
    </label>
  )
}

export default CreateParseTaskModalSearch
