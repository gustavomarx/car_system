'use client'

import Link from 'next/link'
import { Car, Clock, Star } from 'lucide-react'
import { VehicleWithMeta } from '@/types'
import { formatCurrency } from '@/lib/vehicle-utils'
import { Badge } from '@/components/ui/Badge'

export function VehicleDetailCard({ vehicle: v }: { vehicle: VehicleWithMeta }) {
  const isSold = v.status === 'sold'
  const alertBorder = isSold ? '' :
    v.alertLevel === 'critical' ? 'border-t-4 border-t-red-400' :
    v.alertLevel === 'attention' ? 'border-t-4 border-t-amber-400' : 'border-t-4 border-t-emerald-400'

  return (
    <Link href={`/veiculo/${v.id}`}>
      <div className={`ap-card overflow-hidden shadow-sm hover:shadow-md transition-all active:opacity-90 ${alertBorder}`}>
        {/* Imagem */}
        <div className="w-full h-44 bg-ap-surface-2 relative">
          {v.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.images[0].url} alt={v.model} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ap-text-3">
              <Car size={40} />
            </div>
          )}
          {isSold && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Badge variant="default">Vendido</Badge>
            </div>
          )}
          {!isSold && v.label && (
            <span className="absolute top-2 left-2 text-[10px] font-semibold bg-black/60 text-white rounded-full px-2 py-0.5">
              {v.label}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="font-bold text-ap-text text-sm">{v.brand} {v.model}</p>
              <p className="text-xs text-ap-text-3">{v.year}</p>
            </div>
            <p className="text-ap-price font-bold text-base shrink-0">{formatCurrency(v.salePrice)}</p>
          </div>

          {!isSold && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  v.alertLevel === 'critical' ? 'text-red-500 dark:text-red-400' :
                  v.alertLevel === 'attention' ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'
                }`}>
                  <Clock size={11} /> {v.daysInStock}d em estoque
                </div>
                <div className="flex items-center gap-1 text-xs text-ap-text-3">
                  <Star size={11} /> {v.qualityScore}%
                </div>
              </div>
              <div className="h-1.5 bg-ap-surface-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    v.qualityScore >= 80 ? 'bg-emerald-400' :
                    v.qualityScore >= 50 ? 'bg-amber-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${v.qualityScore}%` }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
