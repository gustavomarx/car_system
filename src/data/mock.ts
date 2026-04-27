import { Vehicle, Seller, Client, Sale, Dealership, VehicleOptional } from '@/types'

export const mockDealership: Dealership = {
  id: 'd1',
  name: 'Auto Premium',
  ownerId: 'u1',
}

export const mockSellers: Seller[] = [
  { id: 's1', name: 'Carlos Mendes', defaultCommissionPercent: 3, dealershipId: 'd1' },
  { id: 's2', name: 'Fernanda Lima', defaultCommissionPercent: 2.5, dealershipId: 'd1' },
  { id: 's3', name: 'Rafael Torres', defaultCommissionPercent: 3.5, dealershipId: 'd1' },
]

export const mockClients: Client[] = [
  { id: 'c1', name: 'João Silva', phone: '11999990001', dealershipId: 'd1' },
  { id: 'c2', name: 'Maria Souza', phone: '11999990002', dealershipId: 'd1' },
  { id: 'c3', name: 'Pedro Alves', phone: '11999990003', dealershipId: 'd1' },
]

const now = new Date()
function daysAgo(n: number): string {
  const d = new Date(now)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const mockVehicles: Vehicle[] = [
  {
    id: 'v1',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2022,
    salePrice: 128000,
    purchasePrice: 108000,
    description: 'Veículo em excelente estado, único dono, revisões em dia, IPVA pago, com manual e chave reserva.',
    optionals: ['Ar-condicionado', 'Direção hidráulica/elétrica', 'Vidros elétricos', 'Central multimídia', 'Câmera de ré', 'Airbag', 'ABS'] as VehicleOptional[],
    images: [],
    status: 'available',
    dealershipId: 'd1',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
    history: [
      { id: 'h1', date: daysAgo(5), action: 'created', description: 'Veículo cadastrado no estoque' },
      { id: 'h2', date: daysAgo(1), action: 'edited', description: 'Descrição atualizada' },
    ],
  },
  {
    id: 'v2',
    brand: 'Honda',
    model: 'Civic',
    year: 2021,
    salePrice: 115000,
    purchasePrice: 95000,
    description: 'Civic EXL com teto solar, couro, multimídia, câmera de ré. Financiamento facilitado.',
    optionals: ['Ar-condicionado', 'Central multimídia', 'Bluetooth', 'Câmera de ré', 'Banco de couro', 'Teto solar', 'Airbag', 'ABS'] as VehicleOptional[],
    images: [],
    status: 'available',
    dealershipId: 'd1',
    createdAt: daysAgo(22),
    updatedAt: daysAgo(22),
    history: [
      { id: 'h3', date: daysAgo(22), action: 'created', description: 'Veículo cadastrado no estoque' },
    ],
  },
  {
    id: 'v3',
    brand: 'Jeep',
    model: 'Compass',
    year: 2023,
    salePrice: 198000,
    purchasePrice: 175000,
    description: 'Compass Limited 4x4 diesel. Único dono, sem sinistro, rodas originais.',
    optionals: ['Ar-condicionado', 'Direção hidráulica/elétrica', 'Vidros elétricos', 'Travas elétricas', 'Central multimídia', 'Bluetooth', 'Câmera de ré', 'Sensor de estacionamento', 'Banco de couro', 'Rodas de liga leve', 'Airbag', 'ABS', 'Piloto automático'] as VehicleOptional[],
    images: [],
    status: 'available',
    dealershipId: 'd1',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    history: [
      { id: 'h4', date: daysAgo(3), action: 'created', description: 'Veículo cadastrado no estoque' },
    ],
  },
  {
    id: 'v4',
    brand: 'Volkswagen',
    model: 'T-Cross',
    year: 2020,
    salePrice: 89000,
    purchasePrice: 72000,
    description: 'T-Cross Highline automático, completo. Oportunidade de negócio!',
    optionals: ['Ar-condicionado', 'Vidros elétricos', 'Travas elétricas', 'Bluetooth', 'Rodas de liga leve', 'ABS'] as VehicleOptional[],
    images: [],
    status: 'available',
    dealershipId: 'd1',
    createdAt: daysAgo(38),
    updatedAt: daysAgo(38),
    history: [
      { id: 'h5', date: daysAgo(38), action: 'created', description: 'Veículo cadastrado no estoque' },
    ],
  },
  {
    id: 'v5',
    brand: 'Ford',
    model: 'Mustang',
    year: 2019,
    salePrice: 320000,
    purchasePrice: 290000,
    description: 'Mustang GT 5.0, poucas revisões, impecável.',
    optionals: ['Ar-condicionado', 'Central multimídia', 'Bluetooth', 'Banco de couro', 'Rodas de liga leve', 'Airbag', 'ABS'] as VehicleOptional[],
    images: [],
    status: 'sold',
    dealershipId: 'd1',
    createdAt: daysAgo(60),
    updatedAt: daysAgo(10),
    history: [
      { id: 'h6', date: daysAgo(60), action: 'created', description: 'Veículo cadastrado no estoque' },
      { id: 'h7', date: daysAgo(10), action: 'sold', description: 'Vendido para Pedro Alves por Carlos Mendes' },
    ],
  },
]

export const mockSales: Sale[] = [
  {
    id: 'sale1',
    vehicleId: 'v5',
    sellerId: 's1',
    clientId: 'c3',
    commissionType: 'percent',
    commissionValue: 3,
    finalPrice: 315000,
    date: daysAgo(10),
    dealershipId: 'd1',
    history: [
      { id: 'sh1', date: daysAgo(10), action: 'created', description: 'Venda registrada' },
    ],
  },
]
