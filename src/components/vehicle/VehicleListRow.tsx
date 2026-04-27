'use client'

import Link from 'next/link'
import { Car, Clock } from 'lucide-react'
import { VehicleWithMeta } from '@/types'
import { formatCurrency } from '@/lib/vehicle-utils'

export function VehicleListRow({ vehicle: v }: { vehicle: VehicleWithMeta }) {
  const isSold = v.status === 'sold'
  return (
    <Link href={`/veiculo/${v.id}`}>
      <div
        className="flex items-center gap-3 px-4 py-3 border-b transition-all active:opacity-80 hover:bg-ap-surface-2"
        style={{ borderColor: 'var(--ap-border)' }}
      >
        <div className="w-12 h-10 rounded-lg bg-ap-surface-2 overflow-hidden shrink-0">
          {v.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.images[0].url} alt={v.model} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ap-text-3">
              <Car size={16} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ap-text truncate">{v.brand} {v.model}</p>
          <p className="text-xs text-ap-text-3">{v.year}</p>
        </div>
        {!isSold && (
          <div className={`flex items-center gap-1 text-xs font-medium shrink-0 ${
            v.alertLevel === 'critical' ? 'text-red-500 dark:text-red-400' :
            v.alertLevel === 'attention' ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'
          }`}>
            <Clock size={11} />
            {v.daysInStock}d
          </div>
        )}
        <p className="text-sm font-bold text-ap-price shrink-0">{formatCurrency(v.salePrice)}</p>
      </div>
    </Link>
  )
}
