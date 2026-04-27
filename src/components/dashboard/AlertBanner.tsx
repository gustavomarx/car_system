'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { VehicleWithMeta } from '@/types'

interface AlertBannerProps {
  vehicles: VehicleWithMeta[]
}

export function AlertBanner({ vehicles }: AlertBannerProps) {
  const critical = vehicles.filter((v) => v.alertLevel === 'critical' && v.status === 'available')
  if (critical.length === 0) return null

  return (
    <Link href="/estoque?sort=mais-tempo">
      <div className="mx-4 mt-4 rounded-2xl p-4 flex items-start gap-3 transition-opacity active:opacity-80 bg-red-50 border border-red-200 dark:bg-red-950/50 dark:border-red-900">
        <AlertTriangle size={20} className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            {critical.length} {critical.length === 1 ? 'veículo parado' : 'veículos parados'} há mais de 30 dias
          </p>
          <p className="text-xs text-red-500 dark:text-red-500 mt-0.5">Toque para ver e tomar ação →</p>
        </div>
      </div>
    </Link>
  )
}
