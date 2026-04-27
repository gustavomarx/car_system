export type UserRole = 'admin' | 'seller'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface Seller {
  id: string
  name: string
  defaultCommissionPercent: number
  dealershipId: string
  phone?: string
  email?: string
  document?: string
}

export interface Client {
  id: string
  name: string
  phone: string
  dealershipId: string
}

export type VehicleStatus = 'available' | 'sold' | 'reserved'

export interface VehicleImage {
  id: string
  url: string
  label?: string
  order: number
}

export interface VehicleHistoryEntry {
  id: string
  date: string
  action: 'created' | 'edited' | 'sold' | 'photo_added' | 'reserved' | 'unreserved'
  description: string
  userId?: string
}

export const VEHICLE_OPTIONALS = [
  'Ar-condicionado',
  'Direção hidráulica/elétrica',
  'Vidros elétricos',
  'Travas elétricas',
  'Central multimídia',
  'Bluetooth',
  'Câmera de ré',
  'Sensor de estacionamento',
  'Banco de couro',
  'Rodas de liga leve',
  'Airbag',
  'ABS',
  'Start/Stop',
  'Piloto automático',
  'Teto solar',
] as const

export type VehicleOptional = typeof VEHICLE_OPTIONALS[number]

export interface VehicleExternalIds {
  webmotors?: string
  olx?: string
  icarros?: string
}

export interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  salePrice: number
  purchasePrice?: number
  description: string
  optionals: VehicleOptional[]
  images: VehicleImage[]
  status: VehicleStatus
  dealershipId: string
  createdAt: string
  updatedAt: string
  history: VehicleHistoryEntry[]
  externalIds?: VehicleExternalIds
}

export type CommissionType = 'percent' | 'fixed'

export interface SaleHistoryEntry {
  id: string
  date: string
  action: 'created' | 'edited'
  description: string
}

export interface Sale {
  id: string
  vehicleId: string
  sellerId: string
  clientId?: string
  commissionType: CommissionType
  commissionValue: number
  finalPrice: number
  date: string
  dealershipId: string
  history: SaleHistoryEntry[]
}

export interface Dealership {
  id: string
  name: string
  ownerId: string
}

export type StockAlertLevel = 'normal' | 'attention' | 'critical'

export interface VehicleWithMeta extends Vehicle {
  daysInStock: number
  alertLevel: StockAlertLevel
  label: string
  qualityScore: number
  profit: number | null        // null quando purchasePrice não informado
  profitMargin: number | null  // null quando purchasePrice não informado ou zero
}
