'use client'

import { useState } from 'react'
import { AppShell } from '@/components/ui/AppShell'
import { TopBar } from '@/components/ui/TopBar'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/store/useStore'
import { useUIStore } from '@/store/useUIStore'
import { Seller } from '@/types'
import { UserPlus, Trophy, X, Phone, Mail, FileText, Pencil } from 'lucide-react'

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export default function VendedoresPage() {
  const { sellers, sales, addSeller, updateSeller, currentDealershipId } = useStore()
  const { defaultCommissionPercent } = useUIStore()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [commission, setCommission] = useState(String(defaultCommissionPercent))
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [document, setDocument] = useState('')

  const [selected, setSelected] = useState<Seller | null>(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editCommission, setEditCommission] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editDocument, setEditDocument] = useState('')

  function resetForm() {
    setName(''); setCommission(String(defaultCommissionPercent)); setPhone(''); setEmail(''); setDocument('')
  }

  function handleAdd() {
    addSeller({
      id: `s-${Date.now()}`,
      name: name.trim() || 'Vendedor',
      defaultCommissionPercent: parseFloat(commission) || 3,
      dealershipId: currentDealershipId,
      phone: phone || undefined,
      email: email || undefined,
      document: document || undefined,
    })
    resetForm()
    setShowForm(false)
  }

  function openDetail(seller: Seller) { setSelected(seller); setEditing(false) }

  function openEdit(seller: Seller) {
    setEditName(seller.name)
    setEditCommission(String(seller.defaultCommissionPercent))
    setEditPhone(seller.phone ?? '')
    setEditEmail(seller.email ?? '')
    setEditDocument(seller.document ?? '')
    setEditing(true)
  }

  function handleSaveEdit() {
    if (!selected) return
    updateSeller(selected.id, {
      name: editName.trim() || selected.name,
      defaultCommissionPercent: parseFloat(editCommission) || selected.defaultCommissionPercent,
      phone: editPhone || undefined,
      email: editEmail || undefined,
      document: editDocument || undefined,
    })
    setSelected(null)
    setEditing(false)
  }

  function salesCount(sellerId: string) {
    return sales.filter((s) => s.sellerId === sellerId).length
  }

  const sorted = [...sellers].sort((a, b) => salesCount(b.id) - salesCount(a.id))

  return (
    <AppShell>
      <TopBar
        title="Equipe de Vendas"
        right={
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 text-ap-primary text-sm font-semibold">
            <UserPlus size={18} /> Novo
          </button>
        }
      />

      <div className="px-4 pt-4 pb-6 flex flex-col gap-4">
        {/* Form novo vendedor */}
        {showForm && (
          <div className="ap-card p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ap-text">Novo Vendedor</h2>
              <button onClick={() => { setShowForm(false); resetForm() }}>
                <X size={16} className="text-ap-text-3" />
              </button>
            </div>
            <p className="text-xs text-ap-text-3">Todos os campos são opcionais</p>

            <div>
              <label className="text-xs text-ap-text-2 font-medium mb-1 block">Nome</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do vendedor" className="ap-input" />
            </div>
            <div>
              <label className="text-xs text-ap-text-2 font-medium mb-1 block flex items-center gap-1"><Phone size={11} /> Telefone</label>
              <input value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(11) 99999-9999" inputMode="numeric" className="ap-input" />
            </div>
            <div>
              <label className="text-xs text-ap-text-2 font-medium mb-1 block flex items-center gap-1"><Mail size={11} /> E-mail</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vendedor@email.com" type="email" inputMode="email" className="ap-input" />
            </div>
            <div>
              <label className="text-xs text-ap-text-2 font-medium mb-1 block flex items-center gap-1"><FileText size={11} /> Documento (CPF/RG)</label>
              <input value={document} onChange={(e) => setDocument(e.target.value)} placeholder="000.000.000-00" className="ap-input" />
            </div>
            <div>
              <label className="text-xs text-ap-text-2 font-medium mb-1 block">Comissão padrão (%)</label>
              <div className="relative">
                <input type="number" value={commission} onChange={(e) => setCommission(e.target.value)}
                  placeholder="3" step="0.5" min="0" max="100"
                  className="ap-input" style={{ paddingRight: '2rem' }} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ap-text-3 text-sm">%</span>
              </div>
            </div>
            <Button fullWidth onClick={handleAdd}>Adicionar Vendedor</Button>
          </div>
        )}

        {/* Lista */}
        <div className="flex flex-col gap-3">
          {sorted.map((seller, idx) => {
            const count = salesCount(seller.id)
            return (
              <button key={seller.id} onClick={() => openDetail(seller)}
                className="ap-card p-4 flex items-center gap-4 w-full text-left active:opacity-90 hover:shadow-md transition-all">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  idx === 0 && count > 0
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                    : 'bg-ap-surface-2 text-ap-text-2'
                }`}>
                  {idx === 0 && count > 0 ? <Trophy size={18} /> : seller.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ap-text text-sm">{seller.name}</p>
                  <p className="text-xs text-ap-text-2">{count} venda{count !== 1 ? 's' : ''} · {seller.defaultCommissionPercent}% comissão</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom sheet */}
      {selected && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setSelected(null); setEditing(false) }} />
          <div className="relative rounded-t-2xl p-5 pb-24 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--ap-surface)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-ap-text">{editing ? 'Editar Vendedor' : selected.name}</h2>
              <button onClick={() => { setSelected(null); setEditing(false) }}>
                <X size={20} className="text-ap-text-3" />
              </button>
            </div>

            {!editing ? (
              <>
                <div className="flex flex-col gap-2">
                  {selected.phone && (
                    <div className="flex items-center gap-2 text-sm text-ap-text">
                      <Phone size={14} className="text-ap-text-3" /> {selected.phone}
                    </div>
                  )}
                  {selected.email && (
                    <div className="flex items-center gap-2 text-sm text-ap-text">
                      <Mail size={14} className="text-ap-text-3" /> {selected.email}
                    </div>
                  )}
                  {selected.document && (
                    <div className="flex items-center gap-2 text-sm text-ap-text">
                      <FileText size={14} className="text-ap-text-3" /> {selected.document}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-ap-text">
                    <span className="text-ap-text-3 text-xs">Comissão</span>
                    {selected.defaultCommissionPercent}%
                  </div>
                  <div className="flex items-center gap-2 text-sm text-ap-text">
                    <span className="text-ap-text-3 text-xs">Vendas</span>
                    {salesCount(selected.id)}
                  </div>
                </div>
                <Button fullWidth onClick={() => openEdit(selected)}>
                  <Pencil size={15} className="mr-1.5" /> Editar
                </Button>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs text-ap-text-2 font-medium mb-1 block">Nome</label>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} className="ap-input" />
                  </div>
                  <div>
                    <label className="text-xs text-ap-text-2 font-medium mb-1 block">Telefone</label>
                    <input value={editPhone} onChange={(e) => setEditPhone(maskPhone(e.target.value))}
                      inputMode="numeric" placeholder="(11) 99999-9999" className="ap-input" />
                  </div>
                  <div>
                    <label className="text-xs text-ap-text-2 font-medium mb-1 block">E-mail</label>
                    <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" className="ap-input" />
                  </div>
                  <div>
                    <label className="text-xs text-ap-text-2 font-medium mb-1 block">Documento</label>
                    <input value={editDocument} onChange={(e) => setEditDocument(e.target.value)} className="ap-input" />
                  </div>
                  <div>
                    <label className="text-xs text-ap-text-2 font-medium mb-1 block">Comissão (%)</label>
                    <div className="relative">
                      <input type="number" value={editCommission} onChange={(e) => setEditCommission(e.target.value)}
                        step="0.5" min="0" max="100" className="ap-input" style={{ paddingRight: '2rem' }} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ap-text-3 text-sm">%</span>
                    </div>
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
      )}
    </AppShell>
  )
}
