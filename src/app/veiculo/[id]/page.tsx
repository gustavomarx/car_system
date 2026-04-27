'use client'

import { use } from 'react'
import { AppShell } from '@/components/ui/AppShell'
import { TopBar } from '@/components/ui/TopBar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { QualityScore } from '@/components/vehicle/QualityScore'
import { useStore } from '@/store/useStore'
import { formatCurrency, calcQualityScore } from '@/lib/vehicle-utils'
import { useEnrichedVehicles } from '@/lib/useEnrichedVehicles'
import { Share2, Clock, Edit, ShoppingCart, History, CheckCircle2 } from 'lucide-react'
import { HistoryTimeline } from '@/components/ui/HistoryTimeline'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default function VeiculoPage({ params }: Props) {
  const { id } = use(params)
  const { vehicles, reserveVehicle, unreserveVehicle } = useStore()
  const enrichedAll = useEnrichedVehicles(vehicles)

  const vehicle = vehicles.find((v) => v.id === id)
  const enriched = enrichedAll.find((v) => v.id === id)

  if (!vehicle || !enriched) {
    return (
      <AppShell>
        <TopBar title="Veículo" showBack />
        <div className="flex items-center justify-center h-64 text-ap-text-3">Veículo não encontrado</div>
      </AppShell>
    )
  }

  const quality = calcQualityScore(vehicle)
  const isSold = vehicle.status === 'sold'
  const isReserved = vehicle.status === 'reserved'
  const isAvailable = vehicle.status === 'available'

  function shareWhatsApp() {
    if (!vehicle) return
    const msg = encodeURIComponent(
      `🚗 *${vehicle.brand} ${vehicle.model} ${vehicle.year}*\n💰 ${formatCurrency(vehicle.salePrice)}\n\n${vehicle.description.slice(0, 150)}...\n\nFale conosco para mais informações!`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const alertStyle = {
    normal:    { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-400' },
    attention: { bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-400' },
    critical:  { bg: 'bg-red-50 dark:bg-red-950/50', text: 'text-red-700 dark:text-red-400' },
  }[enriched.alertLevel]

  const sortedImages = [...vehicle.images].sort((a, b) => a.order - b.order)

  return (
    <AppShell>
      <TopBar
        title={`${vehicle.brand} ${vehicle.model}`}
        showBack
        right={
          !isSold ? (
            <Link href={`/veiculo/${id}/editar`}>
              <button
                className="p-2 rounded-lg transition-colors active:opacity-70"
                style={{ color: 'var(--ap-text-2)' }}
              >
                <Edit size={18} />
              </button>
            </Link>
          ) : undefined
        }
      />

      {/* Galeria */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pt-4 pb-2">
        {sortedImages.length > 0 ? (
          sortedImages.map((img) => (
            <div key={img.id} className="shrink-0 w-64 aspect-[4/3] rounded-2xl overflow-hidden bg-ap-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.label ?? ''} className="w-full h-full object-cover" />
            </div>
          ))
        ) : (
          <div className="w-full h-40 rounded-2xl bg-ap-surface-2 flex items-center justify-center text-ap-text-3 text-sm">
            Sem fotos
          </div>
        )}
      </div>

      <div className="px-4 pb-6 flex flex-col gap-4">
        {/* Header info */}
        <div className="flex items-start justify-between gap-2 mt-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-ap-text">{vehicle.brand} {vehicle.model}</h2>
              {isSold && <Badge variant="default">Vendido</Badge>}
              {isReserved && <Badge variant="reserved">Reservado</Badge>}
            </div>
            <p className="text-ap-text-2 text-sm">{vehicle.year}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-ap-price">{formatCurrency(vehicle.salePrice)}</p>
            {vehicle.purchasePrice && (
              <p className="text-xs text-ap-text-3">Compra: {formatCurrency(vehicle.purchasePrice)}</p>
            )}
          </div>
        </div>

        {/* Status: vendido */}
        {isSold ? (
          <div className="rounded-xl px-3 py-2 flex items-center gap-2 text-sm font-medium bg-ap-surface-2 text-ap-text-2">
            <CheckCircle2 size={14} className="text-ap-text-3" />
            Veículo vendido
          </div>
        ) : (
          <>
            {/* Alerta de estoque — apenas disponíveis */}
            <div className={`rounded-xl px-3 py-2 flex items-center gap-2 text-sm font-medium ${alertStyle.bg} ${alertStyle.text}`}>
              <Clock size={14} />
              {enriched.daysInStock} dias em estoque
              {enriched.alertLevel === 'critical' && ' — Veículo parado! Revise preço ou fotos.'}
              {enriched.alertLevel === 'attention' && ' — Atenção ao tempo parado.'}
            </div>

            {/* Etiqueta — apenas disponíveis */}
            {enriched.label && (
              <Badge variant={
                enriched.label === 'Oportunidade' ? 'success' :
                enriched.label === 'Recém chegado' ? 'blue' : 'danger'
              } className="self-start">
                {enriched.label}
              </Badge>
            )}

            {/* Qualidade — apenas disponíveis */}
            <QualityScore score={quality} />
          </>
        )}

        {/* Descrição */}
        {vehicle.description && (
          <div className="ap-card p-4">
            <p className="text-xs text-ap-text-2 font-semibold uppercase tracking-wide mb-2">Descrição</p>
            <p className="text-sm text-ap-text leading-relaxed">{vehicle.description}</p>
          </div>
        )}

        {/* Opcionais */}
        {vehicle.optionals && vehicle.optionals.length > 0 && (
          <div className="ap-card p-4">
            <p className="text-xs text-ap-text-2 font-semibold uppercase tracking-wide mb-3">
              Opcionais <span className="text-ap-text-3 normal-case font-normal">({vehicle.optionals.length})</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {vehicle.optionals.map((opt) => (
                <span key={opt} className="px-2.5 py-1 bg-ap-surface-2 text-ap-text-2 border border-ap-border rounded-full text-xs font-medium">
                  {opt}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Histórico */}
        <div className="ap-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <History size={16} className="text-ap-text-3" />
            <p className="text-xs text-ap-text-2 font-semibold uppercase tracking-wide">Histórico</p>
          </div>
          <HistoryTimeline entries={vehicle.history} />
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-2">
          {isAvailable && (
            <Link href={`/venda/nova?vehicleId=${vehicle.id}`}>
              <Button fullWidth size="lg">
                <ShoppingCart size={18} />
                Registrar Venda
              </Button>
            </Link>
          )}

          {isReserved && (
            <div className="flex flex-col gap-2">
              <div className="rounded-xl px-3 py-2.5 text-sm text-center font-medium"
                style={{ backgroundColor: 'var(--ap-surface-2)', color: 'var(--ap-text-2)' }}>
                Veículo reservado — remova a reserva para vender
              </div>
            </div>
          )}

          {isAvailable && (
            <Button variant="secondary" fullWidth onClick={() => reserveVehicle(vehicle.id)}>
              Reservar Veículo
            </Button>
          )}

          {isReserved && (
            <Button variant="secondary" fullWidth onClick={() => unreserveVehicle(vehicle.id)}>
              Remover Reserva
            </Button>
          )}

          {!isSold && (
            <Button variant="secondary" fullWidth onClick={shareWhatsApp}>
              <Share2 size={18} />
              Compartilhar no WhatsApp
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  )
}
