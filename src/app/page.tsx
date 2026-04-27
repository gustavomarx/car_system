'use client'

import { useMemo } from 'react'
import { AppShell } from '@/components/ui/AppShell'
import { TopBar } from '@/components/ui/TopBar'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { AlertBanner } from '@/components/dashboard/AlertBanner'
import { useStore } from '@/store/useStore'
import { formatCurrency } from '@/lib/vehicle-utils'
import { useEnrichedVehicles } from '@/lib/useEnrichedVehicles'
import { DollarSign, Car, Clock, Trophy, TrendingUp, Percent, Timer } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { vehicles, sellers, sales } = useStore()
  const available = vehicles.filter((v) => v.status === 'available')
  const enriched = useEnrichedVehicles(available)

  const totalStock = available.reduce((s, v) => s + v.salePrice, 0)
  const stoppedCount = enriched.filter((v) => v.alertLevel !== 'normal').length

  const topSeller = useMemo(() => {
    const counts: Record<string, number> = {}
    sales.forEach((s) => { counts[s.sellerId] = (counts[s.sellerId] || 0) + 1 })
    const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
    return sellers.find((s) => s.id === topId)
  }, [sales, sellers])

  const totalRevenue = useMemo(
    () => sales.reduce((s, sale) => s + sale.finalPrice, 0),
    [sales]
  )

  const avgTicket = useMemo(
    () => (sales.length ? totalRevenue / sales.length : 0),
    [totalRevenue, sales]
  )

  const conversionRate = useMemo(() => {
    if (!vehicles.length) return 0
    return (sales.length / vehicles.length) * 100
  }, [vehicles, sales])

  const avgSaleTimeDays = useMemo(() => {
    const soldVehicles = vehicles.filter((v) => v.status === 'sold')
    if (!soldVehicles.length) return null
    const daysList = soldVehicles.map((v) => {
      const sale = sales.find((s) => s.vehicleId === v.id)
      const endDate = sale ? new Date(sale.date) : new Date(v.updatedAt)
      return Math.max(0, Math.floor(
        (endDate.getTime() - new Date(v.createdAt).getTime()) / 86400000
      ))
    })
    return Math.round(daysList.reduce((a, b) => a + b, 0) / daysList.length)
  }, [vehicles, sales])

  const recentVehicles = enriched.slice(0, 3)

  return (
    <AppShell>
      <TopBar title="Auto Premium" />
      <AlertBanner vehicles={enriched} />

      {/* KPIs de Estoque */}
      <div className="p-4 grid grid-cols-2 gap-3 mt-2 lg:grid-cols-4">
        <KpiCard
          label="Valor do Estoque"
          value={formatCurrency(totalStock)}
          sub={`${available.length} veículo${available.length !== 1 ? 's' : ''}`}
          icon={<DollarSign size={18} />}
          accent="violet"
          href="/estoque"
        />
        <KpiCard
          label="Total em Estoque"
          value={String(available.length)}
          sub="disponíveis"
          icon={<Car size={18} />}
          accent="green"
          href="/estoque"
        />
        <KpiCard
          label="Atenção / Parados"
          value={String(stoppedCount)}
          sub="+15 dias sem vender"
          icon={<Clock size={18} />}
          accent={stoppedCount > 0 ? 'red' : 'green'}
          href="/estoque?sort=mais-tempo"
        />
        <KpiCard
          label="Top Vendedor"
          value={topSeller?.name.split(' ')[0] ?? '—'}
          sub={topSeller ? `${sales.filter((s) => s.sellerId === topSeller.id).length} vendas` : 'sem vendas'}
          icon={<Trophy size={18} />}
          accent="amber"
          href="/vendedores"
        />
      </div>

      {/* KPIs de Desempenho de Vendas */}
      <div className="px-4 pb-1 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard
          label="Ticket Médio"
          value={sales.length ? formatCurrency(avgTicket) : '—'}
          sub={`${sales.length} venda${sales.length !== 1 ? 's' : ''}`}
          icon={<TrendingUp size={18} />}
          accent="green"
          href="/vendas"
        />
        <KpiCard
          label="Taxa de Conversão"
          value={vehicles.length ? `${conversionRate.toFixed(1)}%` : '—'}
          sub="vendas / total de veículos"
          icon={<Percent size={18} />}
          accent="blue"
          href="/vendas"
        />
        <div className="col-span-2 lg:col-span-1">
          <KpiCard
            label="Tempo Médio de Venda"
            value={avgSaleTimeDays !== null ? `${avgSaleTimeDays} dias` : '—'}
            sub="desde entrada até venda"
            icon={<Timer size={18} />}
            accent="amber"
            href="/estoque"
          />
        </div>
      </div>

      {/* Estoque Recente */}
      <section className="px-4 mt-3 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ap-text">Estoque Recente</h2>
          <Link href="/estoque" className="text-xs text-ap-primary font-medium">Ver todos →</Link>
        </div>
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3">
          {recentVehicles.map((v) => (
            <Link key={v.id} href={`/veiculo/${v.id}`}>
              <div className="ap-card shadow-sm flex gap-3 p-3 active:opacity-90 hover:shadow-md transition-all">
                <div className="w-20 h-16 rounded-xl bg-ap-surface-2 overflow-hidden shrink-0">
                  {v.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.images[0].url} alt={v.model} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ap-text-3">
                      <Car size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ap-text text-sm truncate">{v.brand} {v.model}</p>
                  <p className="text-xs text-ap-text-2">{v.year}</p>
                  <p className="text-ap-price font-bold text-sm mt-1">{formatCurrency(v.salePrice)}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    v.alertLevel === 'critical' ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' :
                    v.alertLevel === 'attention' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400' :
                    'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                  }`}>
                    {v.daysInStock}d
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  )
}
