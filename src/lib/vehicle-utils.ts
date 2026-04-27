import { Vehicle, VehicleWithMeta, StockAlertLevel } from '@/types'

export function getDaysInStock(createdAt: string): number {
  const created = new Date(createdAt)
  const now = new Date()
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
}

export function getAlertLevel(days: number): StockAlertLevel {
  if (days > 30) return 'critical'
  if (days > 15) return 'attention'
  return 'normal'
}

export function calcProfit(salePrice: number, purchasePrice?: number): number | null {
  if (!purchasePrice) return null
  return salePrice - purchasePrice
}

export function calcProfitMargin(salePrice: number, purchasePrice?: number): number | null {
  if (!purchasePrice) return null
  return ((salePrice - purchasePrice) / purchasePrice) * 100
}

export function getAutoLabel(
  days: number,
  salePrice: number,
  avgPrice: number,
  profitMargin: number | null
): string {
  if (days <= 7) return 'Recém chegado'
  if (days > 30) return 'Parado há muito tempo'
  if (salePrice < avgPrice * 0.9) return 'Oportunidade'
  if (profitMargin !== null && profitMargin >= 20) return 'Alta margem'
  if (profitMargin !== null && profitMargin < 8) return 'Margem baixa'
  return ''
}

export function calcQualityScore(vehicle: Vehicle): number {
  let score = 0

  // Fields: 40pts
  if (vehicle.brand) score += 8
  if (vehicle.model) score += 8
  if (vehicle.year) score += 8
  if (vehicle.salePrice) score += 8
  if (vehicle.description && vehicle.description.length >= 50) score += 8

  // Photos: 60pts
  const photoCount = vehicle.images.length
  if (photoCount >= 1) score += 15
  if (photoCount >= 2) score += 15
  if (photoCount >= 3) score += 15
  if (photoCount >= 4) score += 15

  return Math.min(score, 100)
}

export function enrichVehicle(vehicle: Vehicle, avgPrice: number): VehicleWithMeta {
  const days = getDaysInStock(vehicle.createdAt)
  const profit = calcProfit(vehicle.salePrice, vehicle.purchasePrice)
  const profitMargin = calcProfitMargin(vehicle.salePrice, vehicle.purchasePrice)

  return {
    ...vehicle,
    daysInStock: days,
    alertLevel: getAlertLevel(days),
    label: getAutoLabel(days, vehicle.salePrice, avgPrice, profitMargin),
    qualityScore: calcQualityScore(vehicle),
    profit,
    profitMargin,
  }
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
