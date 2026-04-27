'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/ui/AppShell'
import { TopBar } from '@/components/ui/TopBar'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/store/useStore'
import { formatCurrency } from '@/lib/vehicle-utils'
import { Sale, CommissionType } from '@/types'
import { DollarSign, User, Car, UserPlus, ChevronDown, X } from 'lucide-react'

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

// ─── SearchSelect ─────────────────────────────────────────────────────────────

interface SearchOption { id: string; label: string; sub?: string }

function SearchSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: SearchOption[]
  value: string
  onChange: (id: string) => void
  placeholder: string
}) {
  const selected = options.find((o) => o.id === value)
  const [query, setQuery] = useState(selected?.label ?? '')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Sync query when value changes externally
  useEffect(() => {
    setQuery(selected?.label ?? '')
  }, [value, selected?.label])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = query && !selected
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  function handleSelect(opt: SearchOption) {
    onChange(opt.id)
    setQuery(opt.label)
    setOpen(false)
  }

  function handleClear() {
    onChange('')
    setQuery('')
    setOpen(true)
  }

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          if (selected) onChange('') // deselect if user edits
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="ap-input"
        style={{ paddingRight: '2rem' }}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
        {selected
          ? <button onClick={handleClear}><X size={14} className="text-ap-text-3" /></button>
          : <ChevronDown size={14} className="text-ap-text-3 pointer-events-none" />
        }
      </div>

      {open && filtered.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl overflow-hidden shadow-md max-h-48 overflow-y-auto"
          style={{ backgroundColor: 'var(--ap-surface)', border: '1px solid var(--ap-border)' }}
        >
          {filtered.map((opt) => (
            <button
              key={opt.id}
              onMouseDown={(e) => e.preventDefault()} // prevent blur before click
              onClick={() => handleSelect(opt)}
              className="w-full text-left px-3 py-2.5 flex flex-col gap-0.5 transition-colors hover:bg-ap-surface-2"
            >
              <span className="text-sm text-ap-text font-medium">{opt.label}</span>
              {opt.sub && <span className="text-xs text-ap-text-3">{opt.sub}</span>}
            </button>
          ))}
        </div>
      )}

      {open && query && filtered.length === 0 && (
        <div
          className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl px-3 py-3 shadow-md"
          style={{ backgroundColor: 'var(--ap-surface)', border: '1px solid var(--ap-border)' }}
        >
          <p className="text-xs text-ap-text-3">Nenhum resultado encontrado</p>
        </div>
      )}
    </div>
  )
}

// ─── Form ─────────────────────────────────────────────────────────────────────

function NovaVendaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedVehicleId = searchParams.get('vehicleId') ?? ''

  const { vehicles, sellers, clients, addSale, addClient, currentDealershipId } = useStore()
  const availableVehicles = vehicles.filter((v) => v.status === 'available')

  const [vehicleId, setVehicleId] = useState(preSelectedVehicleId)
  const [sellerId, setSellerId] = useState('')
  const [clientId, setClientId] = useState('')
  const [commissionType, setCommissionType] = useState<CommissionType>('percent')
  const [commissionValue, setCommissionValue] = useState('')
  const [finalPriceStr, setFinalPriceStr] = useState('')
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [showNewClient, setShowNewClient] = useState(false)

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId)
  const selectedSeller = sellers.find((s) => s.id === sellerId)

  useEffect(() => {
    if (selectedSeller) {
      setCommissionValue(String(selectedSeller.defaultCommissionPercent))
      setCommissionType('percent')
    }
  }, [selectedSeller])

  useEffect(() => {
    if (selectedVehicle) setFinalPriceStr(String(selectedVehicle.salePrice))
  }, [selectedVehicle])

  function formatBRL(value: string): string {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    const num = parseInt(digits, 10) / 100
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  }

  const finalPrice = parseFloat(finalPriceStr.replace(/\./g, '').replace(',', '.')) || 0
  const commissionAmount = commissionType === 'percent'
    ? (finalPrice * parseFloat(commissionValue || '0')) / 100
    : parseFloat(commissionValue || '0')

  const vehicleOptions: SearchOption[] = availableVehicles.map((v) => ({
    id: v.id,
    label: `${v.brand} ${v.model} ${v.year}`,
    sub: formatCurrency(v.salePrice),
  }))

  const sellerOptions: SearchOption[] = sellers.map((s) => ({
    id: s.id,
    label: s.name,
    sub: `Comissão padrão: ${s.defaultCommissionPercent}%`,
  }))

  const clientOptions: SearchOption[] = clients.map((c) => ({
    id: c.id,
    label: c.name,
    sub: c.phone,
  }))

  function handleSave() {
    if (!vehicleId || !sellerId) return
    let resolvedClientId = clientId
    if (showNewClient && newClientName) {
      const newId = `c-${Date.now()}`
      addClient({ id: newId, name: newClientName, phone: newClientPhone, dealershipId: currentDealershipId })
      resolvedClientId = newId
    }
    const sale: Sale = {
      id: `sale-${Date.now()}`,
      vehicleId,
      sellerId,
      clientId: resolvedClientId || undefined,
      commissionType,
      commissionValue: parseFloat(commissionValue || '0'),
      finalPrice,
      date: new Date().toISOString(),
      dealershipId: currentDealershipId,
      history: [{ id: `sh-${Date.now()}`, date: new Date().toISOString(), action: 'created', description: 'Venda registrada' }],
    }
    addSale(sale)
    router.push('/vendas')
  }

  const canSave = vehicleId && sellerId && finalPrice > 0

  return (
    <AppShell>
      <TopBar title="Registrar Venda" showBack />

      <div className="px-4 pt-4 pb-6 flex flex-col gap-4">

        {/* Veículo */}
        <div className="ap-card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Car size={16} className="text-ap-primary" />
            <h2 className="text-sm font-semibold text-ap-text">Veículo</h2>
          </div>
          <SearchSelect
            options={vehicleOptions}
            value={vehicleId}
            onChange={setVehicleId}
            placeholder="Buscar veículo..."
          />
        </div>

        {/* Vendedor */}
        <div className="ap-card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <User size={16} className="text-ap-primary" />
            <h2 className="text-sm font-semibold text-ap-text">Vendedor</h2>
          </div>
          <SearchSelect
            options={sellerOptions}
            value={sellerId}
            onChange={setSellerId}
            placeholder="Buscar vendedor..."
          />
        </div>

        {/* Cliente */}
        <div className="ap-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User size={16} className="text-ap-text-3" />
              <h2 className="text-sm font-semibold text-ap-text">
                Cliente <span className="text-ap-text-3 font-normal">(opcional)</span>
              </h2>
            </div>
            <button
              type="button"
              onClick={() => { setShowNewClient(!showNewClient); setClientId('') }}
              className="flex items-center gap-1 text-xs text-ap-primary font-medium"
            >
              <UserPlus size={13} />
              {showNewClient ? 'Selecionar' : 'Novo'}
            </button>
          </div>

          {showNewClient ? (
            <div className="flex flex-col gap-2">
              <input
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Nome do cliente"
                className="ap-input"
              />
              <input
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(maskPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                inputMode="numeric"
                className="ap-input"
              />
            </div>
          ) : (
            <SearchSelect
              options={clientOptions}
              value={clientId}
              onChange={setClientId}
              placeholder="Buscar cliente..."
            />
          )}
        </div>

        {/* Preço final */}
        <div className="ap-card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-ap-primary" />
            <h2 className="text-sm font-semibold text-ap-text">Preço Final</h2>
          </div>
          <div className="relative">
            <span
              className="absolute text-ap-text-3 text-sm font-medium pointer-events-none"
              style={{ left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
            >
              R$
            </span>
            <input
              value={finalPriceStr}
              onChange={(e) => setFinalPriceStr(formatBRL(e.target.value))}
              placeholder="0,00"
              inputMode="numeric"
              className="ap-input"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        {/* Comissão */}
        <div className="ap-card p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ap-text">Comissão</h2>
          <div className="flex gap-2">
            {(['percent', 'fixed'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setCommissionType(type)}
                className={`flex-1 h-10 rounded-xl text-sm font-semibold transition-all ${commissionType === type ? 'text-white' : 'text-ap-text-2'}`}
                style={commissionType === type
                  ? { backgroundColor: 'var(--ap-primary)' }
                  : { border: '1px solid var(--ap-border)', backgroundColor: 'var(--ap-surface-2)' }}
              >
                {type === 'percent' ? 'Percentual (%)' : 'Fixo (R$)'}
              </button>
            ))}
          </div>
          <div className="relative">
            <span
              className="absolute text-ap-text-3 text-sm font-medium pointer-events-none"
              style={{ left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
            >
              {commissionType === 'percent' ? '%' : 'R$'}
            </span>
            <input
              value={commissionValue}
              onChange={(e) => setCommissionValue(e.target.value)}
              inputMode="decimal"
              className="ap-input"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          {commissionAmount > 0 && (
            <p className="text-sm text-emerald-500 dark:text-emerald-400 font-semibold">
              Valor da comissão: {formatCurrency(commissionAmount)}
            </p>
          )}
        </div>

        <Button fullWidth size="lg" onClick={handleSave} disabled={!canSave}>
          Confirmar Venda
        </Button>
      </div>
    </AppShell>
  )
}

export default function NovaVendaPage() {
  return (
    <Suspense>
      <NovaVendaForm />
    </Suspense>
  )
}
