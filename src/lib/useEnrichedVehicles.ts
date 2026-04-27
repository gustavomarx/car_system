'use client'

import { useState, useEffect, useMemo } from 'react'
import { Vehicle, VehicleWithMeta } from '@/types'
import { enrichVehicle } from './vehicle-utils'

export function useEnrichedVehicles(vehicles: Vehicle[]): VehicleWithMeta[] {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const avgPrice = useMemo(() => {
    const avail = vehicles.filter((v) => v.status === 'available')
    return avail.length ? avail.reduce((s, v) => s + v.salePrice, 0) / avail.length : 0
  }, [vehicles])

  const enriched = useMemo(
    () => vehicles.map((v) => enrichVehicle(v, avgPrice)),
    [vehicles, avgPrice]
  )

  // Antes de montar no cliente, retorna array sem enriquecimento temporal
  // para evitar hydration mismatch com `new Date()` no SSR
  if (!mounted) {
    return vehicles.map((v) => ({
      ...v,
      daysInStock: 0,
      alertLevel: 'normal' as const,
      label: '',
      qualityScore: 0,
      profit: null,
      profitMargin: null,
    }))
  }

  return enriched
}
