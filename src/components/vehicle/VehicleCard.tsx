'use client'

import Link from 'next/link'
import { Car, Clock, Star } from 'lucide-react'
import { VehicleWithMeta } from '@/types'
import { formatCurrency } from '@/lib/vehicle-utils'
import { Badge } from '@/components/ui/Badge'

interface VehicleCardProps {
  vehicle: VehicleWithMeta
}

const alertBorder = {
  normal:    'border-l-emerald-400',
  attention: 'border-l-amber-400',
  critical:  'border-l-red-400',
}

export function VehicleCard({ vehicle: v }: VehicleCardProps) {
  const isSold = v.status === 'sold'
  const isReserved = v.status === 'reserved'
  const borderColor = isSold
    ? 'border-l-ap-border'
    : isReserved
      ? 'border-l-violet-400'
      : alertBorder[v.alertLevel]

  return (
    <Link href={`/veiculo/${v.id}`}>
      <div
        className={`ap-card border-l-4 shadow-sm overflow-hidden active:opacity-90 transition-all hover:shadow-md ${borderColor}`}
      >
        <div className="flex gap-3 p-3">
          {/* Imagem */}
          <div className="w-24 h-[72px] rounded-xl bg-ap-surface-2 overflow-hidden shrink-0 relative">
            {v.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.images[0].url} alt={v.model} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ap-text-3">
                <Car size={28} />
              </div>
            )}
            {!isSold && v.label && (
              <span className="absolute bottom-1 left-1 right-1 text-center text-[9px] font-semibold bg-black/60 text-white rounded px-1 py-0.5 leading-tight truncate">
                {v.label}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <p className="font-bold text-ap-text text-sm leading-tight truncate">{v.brand} {v.model}</p>
                <p className="text-xs text-ap-text-3">{v.year}</p>
              </div>
              {isSold && <Badge variant="default">Vendido</Badge>}
              {isReserved && <Badge variant="reserved">Reservado</Badge>}
            </div>

            <p className="text-ap-price font-bold text-base mt-1">{formatCurrency(v.salePrice)}</p>

            <div className="flex items-center gap-3 mt-1.5">
              {!isSold && (
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  v.alertLevel === 'critical' ? 'text-red-500 dark:text-red-400' :
                  v.alertLevel === 'attention' ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'
                }`}>
                  <Clock size={11} />
                  {v.daysInStock}d em estoque
                </div>
              )}
              {!isSold && (
                <div className="flex items-center gap-1 text-xs text-ap-text-3">
                  <Star size={11} />
                  {v.qualityScore}%
                </div>
              )}
            </div>

            {!isSold && (
              <div className="mt-2 h-1 bg-ap-surface-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    v.qualityScore >= 80 ? 'bg-emerald-400' :
                    v.qualityScore >= 50 ? 'bg-amber-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${v.qualityScore}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Alerta crítico */}
        {!isSold && v.alertLevel === 'critical' && (
          <div className="px-3 pb-2">
            <p className="text-xs text-red-500 dark:text-red-400 font-medium">
              ⚠️ Parado há {v.daysInStock} dias
            </p>
          </div>
        )}
      </div>
    </Link>
  )
}
