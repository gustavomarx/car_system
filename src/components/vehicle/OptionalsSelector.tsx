'use client'

import { VEHICLE_OPTIONALS, VehicleOptional } from '@/types'

interface OptionalsSelectorProps {
  selected: VehicleOptional[]
  onChange: (selected: VehicleOptional[]) => void
}

export function OptionalsSelector({ selected, onChange }: OptionalsSelectorProps) {
  function toggle(item: VehicleOptional) {
    if (selected.includes(item)) {
      onChange(selected.filter((s) => s !== item))
    } else {
      onChange([...selected, item])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {VEHICLE_OPTIONALS.map((item) => {
        const active = selected.includes(item)
        return (
          <button
            key={item}
            type="button"
            onClick={() => toggle(item)}
            className={`h-8 px-3 rounded-full text-xs font-medium border transition-colors ${
              active
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 active:bg-slate-50'
            }`}
          >
            {active && <span className="mr-1">✓</span>}
            {item}
          </button>
        )
      })}
    </div>
  )
}
