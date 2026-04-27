'use client'

import { useState } from 'react'
import { AppShell } from '@/components/ui/AppShell'
import { TopBar } from '@/components/ui/TopBar'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/store/useStore'
import { formatCurrency } from '@/lib/vehicle-utils'
import { Sale, CommissionType } from '@/types'
import { PlusCircle, TrendingUp, X, Pencil, Clock } from 'lucide-react'
import { HistoryTimeline } from '@/components/ui/HistoryTimeline'
import Link from 'next/link'

function formatBRL(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  const num = parseInt(digits, 10) / 100
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

function parseBRL(value: string): number {
  return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0
}

function numToBRL(num: number): string {
  if (!num) return ''
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

const inputStyle = {
  border: '1px solid var(--ap-border)',
  backgroundColor: 'var(--ap-surface)',
  color: 'var(--ap-text)',
}

export default function VendasPage() {
  const { sales, vehicles, sellers, clients, updateSale } = useStore()

  const [selected, setSelected] = useState<Sale | null>(null)
  const [editing, setEditing] = useState(false)
  const [editFinalPrice, setEditFinalPrice] = useState('')
  const [editCommissionType, setEditCommissionType] = useState<CommissionType>('percent')
  const [editCommissionValue, setEditCommissionValue] = useState('')
  const [editSellerId, setEditSellerId] = useState('')
  const [editClientId, setEditClientId] = useState('')

  const sortedSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const totalRevenue = sales.reduce((s, sale) => s + sale.finalPrice, 0)
  const totalCommission = sales.reduce((s, sale) => {
    const commission = sale.commissionType === 'percent'
      ? (sale.finalPrice * sale.commissionValue) / 100
      : sale.commissionValue
    return s + commission
  }, 0)

  function calcCommission(sale: Sale) {
    return sale.commissionType === 'percent'
      ? (sale.finalPrice * sale.commissionValue) / 100
      : sale.commissionValue
  }

  function openDetail(sale: Sale) { setSelected(sale); setEditing(false) }

  function openEdit(sale: Sale) {
    setEditFinalPrice(numToBRL(sale.finalPrice))
    setEditCommissionType(sale.commissionType)
    setEditCommissionValue(String(sale.commissionValue))
    setEditSellerId(sale.sellerId)
    setEditClientId(sale.clientId ?? '')
    setEditing(true)
  }

  function handleSaveEdit() {
    if (!selected) return
    const newFinalPrice = parseBRL(editFinalPrice)
    const newCommissionValue = parseFloat(editCommissionValue || '0')
    const changes: string[] = []
    if (newFinalPrice !== selected.finalPrice)
      changes.push(`Preço: ${formatCurrency(selected.finalPrice)} → ${formatCurrency(newFinalPrice)}`)
    if (editCommissionType !== selected.commissionType || newCommissionValue !== selected.commissionValue)
      changes.push(`Comissão: ${selected.commissionValue}${selected.commissionType === 'percent' ? '%' : ' R$'} → ${newCommissionValue}${editCommissionType === 'percent' ? '%' : ' R$'}`)
    if (editSellerId !== selected.sellerId) {
      const oldSeller = sellers.find((s) => s.id === selected.sellerId)?.name ?? selected.sellerId
      const newSeller = sellers.find((s) => s.id === editSellerId)?.name ?? editSellerId
      changes.push(`Vendedor: ${oldSeller} → ${newSeller}`)
    }
    if (editClientId !== (selected.clientId ?? '')) {
      const oldClient = clients.find((c) => c.id === selected.clientId)?.name ?? '—'
      const newClient = clients.find((c) => c.id === editClientId)?.name ?? '—'
      changes.push(`Cliente: ${oldClient} → ${newClient}`)
    }
    updateSale(selected.id, {
      finalPrice: newFinalPrice,
      commissionType: editCommissionType,
      commissionValue: newCommissionValue,
      sellerId: editSellerId,
      clientId: editClientId || undefined,
      history: [...(selected.history ?? []), {
        id: `sh-${Date.now()}`,
        date: new Date().toISOString(),
        action: 'edited' as const,
        description: changes.length > 0 ? changes.join(' | ') : 'Venda atualizada',
      }],
    })
    setSelected(null)
    setEditing(false)
  }

  return (
    <AppShell>
      <TopBar
        title="Vendas"
        right={
          <Link href="/venda/nova">
            <button className="flex items-center gap-1 text-ap-primary text-sm font-semibold">
              <PlusCircle size={18} />
              Nova
            </button>
          </Link>
        }
      />

      <div className="px-4 pt-4 pb-6 flex flex-col gap-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="ap-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={15} className="text-ap-primary" />
              <p className="text-xs text-ap-text-2 font-medium uppercase tracking-wide">Receita Total</p>
            </div>
            <p className="text-base font-bold text-ap-text leading-tight break-words">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-ap-text-3 mt-0.5">{sales.length} venda{sales.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="ap-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={15} className="text-emerald-500" />
              <p className="text-xs text-ap-text-2 font-medium uppercase tracking-wide">Comissões</p>
            </div>
            <p className="text-base font-bold text-ap-text leading-tight break-words">{formatCurrency(totalCommission)}</p>
            <p className="text-xs text-ap-text-3 mt-0.5">total pago</p>
          </div>
        </div>

        {/* Lista */}
        {sortedSales.length === 0 ? (
          <div className="text-center py-16 text-ap-text-3">
            <p className="text-4xl mb-2">💸</p>
            <p className="text-sm">Nenhuma venda registrada ainda</p>
            <Link href="/venda/nova"><Button className="mt-4">Registrar primeira venda</Button></Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedSales.map((sale) => {
              const vehicle = vehicles.find((v) => v.id === sale.vehicleId)
              const seller = sellers.find((s) => s.id === sale.sellerId)
              const client = clients.find((c) => c.id === sale.clientId)
              const commission = calcCommission(sale)
              return (
                <button key={sale.id} onClick={() => openDetail(sale)}
                  className="ap-card p-4 w-full text-left active:opacity-90 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-ap-text text-sm truncate">
                        {vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : 'Veículo removido'}
                      </p>
                      <p className="text-xs text-ap-text-2 mt-0.5">
                        {seller?.name ?? '—'} {client ? `→ ${client.name}` : ''}
                      </p>
                      <p className="text-xs text-ap-text-3 mt-0.5">{new Date(sale.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-ap-price font-bold text-base">{formatCurrency(sale.finalPrice)}</p>
                      <p className="text-xs text-emerald-500 dark:text-emerald-400 font-medium">+{formatCurrency(commission)} comissão</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom sheet */}
      {selected && (() => {
        const vehicle = vehicles.find((v) => v.id === selected.vehicleId)
        const seller = sellers.find((s) => s.id === selected.sellerId)
        const client = clients.find((c) => c.id === selected.clientId)
        const commission = calcCommission(selected)
        const editCommissionAmount = editCommissionType === 'percent'
          ? (parseBRL(editFinalPrice) * parseFloat(editCommissionValue || '0')) / 100
          : parseFloat(editCommissionValue || '0')

        return (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => { setSelected(null); setEditing(false) }} />
            <div className="relative rounded-t-2xl p-5 pb-24 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--ap-surface)' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-ap-text">
                  {editing ? 'Editar Venda' : (vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Venda')}
                </h2>
                <button onClick={() => { setSelected(null); setEditing(false) }}>
                  <X size={20} className="text-ap-text-3" />
                </button>
              </div>

              {!editing ? (
                <>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: 'Veículo', value: vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : '—' },
                      { label: 'Vendedor', value: seller?.name ?? '—' },
                      { label: 'Cliente', value: client?.name ?? '—' },
                      { label: 'Data', value: new Date(selected.date).toLocaleDateString('pt-BR') },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-ap-text-3">{label}</span>
                        <span className="font-medium text-ap-text">{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm">
                      <span className="text-ap-text-3">Preço final</span>
                      <span className="font-bold text-ap-price">{formatCurrency(selected.finalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-ap-text-3">Comissão</span>
                      <span className="font-medium text-emerald-500 dark:text-emerald-400">
                        {selected.commissionValue}{selected.commissionType === 'percent' ? '%' : ' R$'} = {formatCurrency(commission)}
                      </span>
                    </div>
                  </div>

                  {selected.history && selected.history.length > 0 && (
                    <div className="pt-3" style={{ borderTop: '1px solid var(--ap-border)' }}>
                      <p className="text-xs font-semibold text-ap-text-2 mb-3 flex items-center gap-1">
                        <Clock size={12} /> Histórico
                      </p>
                      <HistoryTimeline entries={selected.history} />
                    </div>
                  )}
                  <Button fullWidth onClick={() => openEdit(selected)}><Pencil size={15} className="mr-1.5" /> Editar</Button>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-xs text-ap-text-2 font-medium mb-1 block">Preço Final</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ap-text-3 text-sm pointer-events-none">R$</span>
                        <input value={editFinalPrice} onChange={(e) => setEditFinalPrice(formatBRL(e.target.value))}
                          inputMode="numeric"
                          className="w-full h-11 pr-3 rounded-xl text-sm focus:outline-none"
                          style={{ ...inputStyle, paddingLeft: '2.5rem', boxShadow: undefined }}
                          onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px var(--ap-primary)'}
                          onBlur={(e) => e.currentTarget.style.boxShadow = 'none'} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-ap-text-2 font-medium mb-1 block">Vendedor</label>
                      <select value={editSellerId} onChange={(e) => setEditSellerId(e.target.value)} className="ap-select">
                        {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-ap-text-2 font-medium mb-1 block">Cliente</label>
                      <select value={editClientId} onChange={(e) => setEditClientId(e.target.value)} className="ap-select">
                        <option value="">Sem cliente</option>
                        {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-ap-text-2 font-medium mb-1 block">Tipo de Comissão</label>
                      <div className="flex gap-2">
                        {(['percent', 'fixed'] as const).map((type) => (
                          <button key={type} type="button" onClick={() => setEditCommissionType(type)}
                            className={`flex-1 h-10 rounded-xl text-sm font-semibold transition-all ${editCommissionType === type ? 'text-white' : 'text-ap-text-2'}`}
                            style={editCommissionType === type
                              ? { backgroundColor: 'var(--ap-primary)' }
                              : { border: '1px solid var(--ap-border)', backgroundColor: 'var(--ap-surface-2)' }}>
                            {type === 'percent' ? 'Percentual (%)' : 'Fixo (R$)'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-ap-text-2 font-medium mb-1 block">Valor da Comissão</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ap-text-3 text-sm pointer-events-none">
                          {editCommissionType === 'percent' ? '%' : 'R$'}
                        </span>
                        <input value={editCommissionValue} onChange={(e) => setEditCommissionValue(e.target.value)}
                          inputMode="decimal"
                          className="w-full h-11 pr-3 rounded-xl text-sm focus:outline-none"
                          style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                          onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px var(--ap-primary)'}
                          onBlur={(e) => e.currentTarget.style.boxShadow = 'none'} />
                      </div>
                      {editCommissionAmount > 0 && (
                        <p className="text-xs text-emerald-500 dark:text-emerald-400 font-medium mt-1">= {formatCurrency(editCommissionAmount)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setEditing(false)}
                      className="flex-1 h-11 rounded-xl text-sm font-semibold text-ap-text-2"
                      style={{ border: '1px solid var(--ap-border)', backgroundColor: 'var(--ap-surface-2)' }}>
                      Cancelar
                    </button>
                    <Button className="flex-1" onClick={handleSaveEdit}>Salvar</Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })()}
    </AppShell>
  )
}
