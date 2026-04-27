'use client'

import { useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/ui/AppShell'
import { TopBar } from '@/components/ui/TopBar'
import { VehicleCard } from '@/components/vehicle/VehicleCard'
import { VehicleListRow } from '@/components/vehicle/VehicleListRow'
import { VehicleDetailCard } from '@/components/vehicle/VehicleDetailCard'
import { useStore } from '@/store/useStore'
import { useEnrichedVehicles } from '@/lib/useEnrichedVehicles'
import { useUIStore } from '@/store/useUIStore'
import { VehicleWithMeta } from '@/types'
import { Search, LayoutGrid, List, LayoutList } from 'lucide-react'

type SortKey = 'maior-preco' | 'menor-preco' | 'mais-tempo' | 'melhor-qualidade'
type TabFilter = 'disponiveis' | 'vendidos'

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'mais-tempo', label: 'Mais tempo' },
  { key: 'melhor-qualidade', label: 'Qualidade' },
  { key: 'maior-preco', label: 'Maior preço' },
  { key: 'menor-preco', label: 'Menor preço' },
]

function sortVehicles(vehicles: VehicleWithMeta[], key: SortKey): VehicleWithMeta[] {
  return [...vehicles].sort((a, b) => {
    switch (key) {
      case 'maior-preco': return b.salePrice - a.salePrice
      case 'menor-preco': return a.salePrice - b.salePrice
      case 'mais-tempo': return b.daysInStock - a.daysInStock
      case 'melhor-qualidade': return b.qualityScore - a.qualityScore
    }
  })
}

function EstoqueContent() {
  const { vehicles } = useStore()
  const searchParams = useSearchParams()
  const sortParam = searchParams.get('sort') as SortKey | null
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>(sortParam ?? 'mais-tempo')
  const [tab, setTab] = useState<TabFilter>('disponiveis')
  const { stockView, setStockView } = useUIStore()

  const enriched = useEnrichedVehicles(vehicles)

  const filtered = useMemo(() => {
    let list = enriched
    if (tab === 'disponiveis') {
      list = list.filter((v) => v.status !== 'sold')
    } else {
      list = list.filter((v) => v.status === 'sold')
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((v) => `${v.brand} ${v.model} ${v.year}`.toLowerCase().includes(q))
    }
    return sortVehicles(list, sortKey)
  }, [enriched, tab, search, sortKey])

  const availableCount = enriched.filter((v) => v.status !== 'sold').length
  const soldCount = enriched.filter((v) => v.status === 'sold').length

  return (
    <AppShell>
      <TopBar title="Estoque" />

      <div className="px-4 pt-3 pb-2 flex flex-col gap-3">
        {/* Tabs */}
        <div className="flex rounded-xl p-1 gap-1" style={{ backgroundColor: 'var(--ap-surface-2)' }}>
          <button
            onClick={() => setTab('disponiveis')}
            className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-all ${
              tab === 'disponiveis'
                ? 'shadow-sm text-ap-text'
                : 'text-ap-text-2'
            }`}
            style={tab === 'disponiveis' ? { backgroundColor: 'var(--ap-surface)' } : {}}
          >
            Disponíveis {availableCount > 0 && `(${availableCount})`}
          </button>
          <button
            onClick={() => setTab('vendidos')}
            className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-all ${
              tab === 'vendidos'
                ? 'shadow-sm text-ap-text'
                : 'text-ap-text-2'
            }`}
            style={tab === 'vendidos' ? { backgroundColor: 'var(--ap-surface)' } : {}}
          >
            Vendidos {soldCount > 0 && `(${soldCount})`}
          </button>
        </div>

        {/* Search + View toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ap-text-3" />
            <input
              type="search"
              placeholder="Buscar marca, modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ap-input"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-xl border p-1" style={{ borderColor: 'var(--ap-border)', backgroundColor: 'var(--ap-surface)' }}>
            {([
              { key: 'card', Icon: LayoutGrid },
              { key: 'list', Icon: List },
              { key: 'detail', Icon: LayoutList },
            ] as const).map(({ key, Icon }) => (
              <button
                key={key}
                onClick={() => setStockView(key)}
                className={`p-1.5 rounded-lg transition-all ${
                  stockView === key ? 'text-ap-primary' : 'text-ap-text-3'
                }`}
                style={stockView === key ? { backgroundColor: 'var(--ap-primary-sub)' } : {}}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>

        {/* Sort chips */}
        {tab === 'disponiveis' && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {sortOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortKey(opt.key)}
                className={`shrink-0 px-3 h-8 rounded-full text-xs font-semibold transition-all border ${
                  sortKey === opt.key
                    ? 'text-white border-transparent'
                    : 'text-ap-text-2 border-ap-border'
                }`}
                style={sortKey === opt.key ? { backgroundColor: 'var(--ap-primary)' } : { backgroundColor: 'var(--ap-surface)' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`px-4 pb-4 ${stockView === 'detail' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : stockView === 'list' ? '' : 'flex flex-col gap-3'}`}>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-ap-text-3 col-span-full">
            <p className="text-4xl mb-2">{tab === 'vendidos' ? '✅' : '🚗'}</p>
            <p className="text-sm">
              {tab === 'vendidos' ? 'Nenhuma venda registrada' : 'Nenhum veículo encontrado'}
            </p>
          </div>
        )}
        {stockView === 'card' && filtered.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
        {stockView === 'list' && (
          <div className="ap-card overflow-hidden">
            {filtered.map((v) => <VehicleListRow key={v.id} vehicle={v} />)}
          </div>
        )}
        {stockView === 'detail' && filtered.map((v) => <VehicleDetailCard key={v.id} vehicle={v} />)}
      </div>
    </AppShell>
  )
}

export default function EstoquePage() {
  return (
    <Suspense>
      <EstoqueContent />
    </Suspense>
  )
}
