import { Vehicle, Seller, Client } from '@/types'

// ─── Parser ──────────────────────────────────────────────────────────────────

export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean)
  if (lines.length < 2) return []

  const headers = splitCSVLine(lines[0]).map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const values = splitCSVLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? '').trim()
    })
    return row
  })
}

function splitCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ';' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

// ─── Download helper ─────────────────────────────────────────────────────────

export function downloadCSV(filename: string, content: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Templates ───────────────────────────────────────────────────────────────

export const VEHICLE_TEMPLATE_HEADERS = [
  'marca', 'modelo', 'ano', 'preco_venda', 'preco_compra', 'descricao',
]

export const SELLER_TEMPLATE_HEADERS = ['nome', 'comissao_padrao', 'telefone', 'email']

export const CLIENT_TEMPLATE_HEADERS = ['nome', 'telefone']

const SEP = ';'

export function getVehicleTemplate(): string {
  const header = VEHICLE_TEMPLATE_HEADERS.join(SEP)
  const rows = [
    'Toyota;Corolla;2022;128000;108000;Unico dono revisoes em dia',
    'Honda;Civic;2021;115000;;',
    'Jeep;Compass;2023;198000;175000;Completo 4x4 diesel',
  ]
  return `${header}\n${rows.join('\n')}\n`
}

export function getSellerTemplate(): string {
  const header = SELLER_TEMPLATE_HEADERS.join(SEP)
  const rows = [
    'Carlos Mendes;3;11999990001;carlos@email.com',
    'Fernanda Lima;2.5;11999990002;',
  ]
  return `${header}\n${rows.join('\n')}\n`
}

export function getClientTemplate(): string {
  const header = CLIENT_TEMPLATE_HEADERS.join(SEP)
  const rows = [
    'Joao Silva;11999990001',
    'Maria Souza;11999990002',
  ]
  return `${header}\n${rows.join('\n')}\n`
}

// ─── Row → Entity ─────────────────────────────────────────────────────────────

export type ParseError = { row: number; field: string; message: string }

export interface VehicleParseResult {
  vehicles: Omit<Vehicle, 'id' | 'dealershipId' | 'images' | 'createdAt' | 'updatedAt' | 'history'>[]
  errors: ParseError[]
}

export interface SellerParseResult {
  sellers: Omit<Seller, 'id' | 'dealershipId'>[]
  errors: ParseError[]
}

export interface ClientParseResult {
  clients: Omit<Client, 'id' | 'dealershipId'>[]
  errors: ParseError[]
}

export function parseVehicleRows(rows: Record<string, string>[]): VehicleParseResult {
  const vehicles: VehicleParseResult['vehicles'] = []
  const errors: ParseError[] = []

  rows.forEach((row, i) => {
    const rowNum = i + 2
    const rowErrors: ParseError[] = []

    if (!row['marca']) rowErrors.push({ row: rowNum, field: 'marca', message: 'Obrigatório' })
    if (!row['modelo']) rowErrors.push({ row: rowNum, field: 'modelo', message: 'Obrigatório' })

    const year = parseInt(row['ano'])
    if (!row['ano'] || isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1)
      rowErrors.push({ row: rowNum, field: 'ano', message: 'Ano inválido' })

    const salePrice = parseFloat(row['preco_venda']?.replace(/\./g, '').replace(',', '.'))
    if (!row['preco_venda'] || isNaN(salePrice) || salePrice <= 0)
      rowErrors.push({ row: rowNum, field: 'preco_venda', message: 'Preço inválido' })

    if (rowErrors.length) {
      errors.push(...rowErrors)
      return
    }

    const purchasePrice = row['preco_compra']
      ? parseFloat(row['preco_compra'].replace(/\./g, '').replace(',', '.'))
      : undefined

    vehicles.push({
      brand: row['marca'],
      model: row['modelo'],
      year,
      salePrice,
      purchasePrice: purchasePrice && !isNaN(purchasePrice) ? purchasePrice : undefined,
      description: row['descricao'] ?? '',
      optionals: [],
      status: 'available',
    })
  })

  return { vehicles, errors }
}

export function parseSellerRows(rows: Record<string, string>[]): SellerParseResult {
  const sellers: SellerParseResult['sellers'] = []
  const errors: ParseError[] = []

  rows.forEach((row, i) => {
    const rowNum = i + 2
    const rowErrors: ParseError[] = []

    if (!row['nome']) rowErrors.push({ row: rowNum, field: 'nome', message: 'Obrigatório' })

    const commission = parseFloat(row['comissao_padrao']?.replace(',', '.'))
    if (!row['comissao_padrao'] || isNaN(commission) || commission < 0 || commission > 100)
      rowErrors.push({ row: rowNum, field: 'comissao_padrao', message: 'Valor inválido (0–100)' })

    if (rowErrors.length) {
      errors.push(...rowErrors)
      return
    }

    sellers.push({
      name: row['nome'],
      defaultCommissionPercent: commission,
      phone: row['telefone'] || undefined,
      email: row['email'] || undefined,
    })
  })

  return { sellers, errors }
}

export function parseClientRows(rows: Record<string, string>[]): ClientParseResult {
  const clients: ClientParseResult['clients'] = []
  const errors: ParseError[] = []

  rows.forEach((row, i) => {
    const rowNum = i + 2
    if (!row['nome']) {
      errors.push({ row: rowNum, field: 'nome', message: 'Obrigatório' })
      return
    }
    clients.push({
      name: row['nome'],
      phone: row['telefone'] ?? '',
    })
  })

  return { clients, errors }
}
