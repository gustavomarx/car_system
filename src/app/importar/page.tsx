'use client'

import { useState, useRef } from 'react'
import { AppShell } from '@/components/ui/AppShell'
import { TopBar } from '@/components/ui/TopBar'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/store/useStore'
import { useUIStore } from '@/store/useUIStore'
import {
  parseCSV, downloadCSV,
  getVehicleTemplate, getSellerTemplate, getClientTemplate,
  parseVehicleRows, parseSellerRows, parseClientRows,
  VehicleParseResult, SellerParseResult, ClientParseResult, ParseError,
} from '@/lib/csvUtils'
import { Vehicle, Seller, Client } from '@/types'
import { Download, Upload, CheckCircle, Car, Users, UserRound, X, Pencil, Trash2 } from 'lucide-react'

type Tab = 'vehicles' | 'sellers' | 'clients'

const FIELD_LABELS: Record<string, string> = {
  marca: 'Marca',
  modelo: 'Modelo',
  ano: 'Ano',
  preco_venda: 'Preço de Venda',
  preco_compra: 'Preço de Compra',
  descricao: 'Descrição',
  nome: 'Nome',
  comissao_padrao: 'Comissão (%)',
  telefone: 'Telefone',
  email: 'E-mail',
}

function ErrorList({ errors }: { errors: ParseError[] }) {
  if (!errors.length) return null
  return (
    <div className="rounded-xl p-3 flex flex-col gap-1" style={{ backgroundColor: 'var(--ap-surface-2)', border: '1px solid var(--ap-border)' }}>
      <p className="text-xs font-semibold text-red-500 mb-1">Erros encontrados — corrija os dados e tente novamente:</p>
      {errors.map((e, i) => (
        <p key={i} className="text-xs text-ap-text-2">
          <span className="font-medium">Linha {e.row}</span> · {e.field}: {e.message}
        </p>
      ))}
    </div>
  )
}

function PreviewTable({
  headers,
  rows,
  onEdit,
  onDelete,
}: {
  headers: string[]
  rows: Record<string, string>[]
  onEdit: (index: number) => void
  onDelete: (index: number) => void
}) {
  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--ap-border)' }}>
      <table className="text-xs w-full">
        <thead>
          <tr style={{ backgroundColor: 'var(--ap-surface-2)', borderBottom: '1px solid var(--ap-border)' }}>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-semibold text-ap-text-2 whitespace-nowrap">
                {FIELD_LABELS[h] ?? h}
              </th>
            ))}
            <th className="px-3 py-2 w-16" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--ap-border)' : undefined }}>
              {headers.map((h) => (
                <td key={h} className="px-3 py-2 text-ap-text max-w-[140px] truncate">{row[h] || '—'}</td>
              ))}
              <td className="px-2 py-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(i)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-ap-surface-2"
                    title="Editar"
                  >
                    <Pencil size={13} className="text-ap-text-3" />
                  </button>
                  <button
                    onClick={() => onDelete(i)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-ap-surface-2"
                    title="Remover"
                  >
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EditSheet({
  headers,
  row,
  onSave,
  onClose,
}: {
  headers: string[]
  row: Record<string, string>
  onSave: (updated: Record<string, string>) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<Record<string, string>>({ ...row })

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative rounded-t-2xl flex flex-col max-h-[85vh]"
        style={{ backgroundColor: 'var(--ap-surface)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: '1px solid var(--ap-border)' }}>
          <p className="text-sm font-semibold text-ap-text">Editar registro</p>
          <button onClick={onClose}><X size={18} className="text-ap-text-3" /></button>
        </div>

        {/* Fields */}
        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4 pb-6">
          {headers.map((field) => (
            <div key={field}>
              <label className="text-xs font-medium text-ap-text-2 mb-1 block">
                {FIELD_LABELS[field] ?? field}
              </label>
              {field === 'descricao' ? (
                <textarea
                  value={draft[field] ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                  rows={3}
                  className="ap-textarea"
                />
              ) : (
                <input
                  value={draft[field] ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                  className="ap-input"
                  type={['ano', 'preco_venda', 'preco_compra', 'comissao_padrao'].includes(field) ? 'number' : 'text'}
                />
              )}
            </div>
          ))}
        </div>

        {/* Save */}
        <div className="px-5 pb-8 pt-2" style={{ borderTop: '1px solid var(--ap-border)' }}>
          <Button fullWidth onClick={() => onSave(draft)}>Salvar alterações</Button>
        </div>
      </div>
    </div>
  )
}

export default function ImportarPage() {
  const [tab, setTab] = useState<Tab>('vehicles')
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([])
  const [fileName, setFileName] = useState('')
  const [done, setDone] = useState(false)
  const [importing, setImporting] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { addVehicle, addSeller, addClient, currentDealershipId } = useStore()
  const { defaultCommissionPercent } = useUIStore()

  const vehicleResult: VehicleParseResult = tab === 'vehicles' && rawRows.length ? parseVehicleRows(rawRows) : { vehicles: [], errors: [] }
  const sellerResult: SellerParseResult = tab === 'sellers' && rawRows.length ? parseSellerRows(rawRows) : { sellers: [], errors: [] }
  const clientResult: ClientParseResult = tab === 'clients' && rawRows.length ? parseClientRows(rawRows) : { clients: [], errors: [] }

  const errors = tab === 'vehicles' ? vehicleResult.errors : tab === 'sellers' ? sellerResult.errors : clientResult.errors
  const hasData = rawRows.length > 0 && errors.length === 0
  const previewCount = tab === 'vehicles' ? vehicleResult.vehicles.length : tab === 'sellers' ? sellerResult.sellers.length : clientResult.clients.length

  const tabHeaders: Record<Tab, string[]> = {
    vehicles: ['marca', 'modelo', 'ano', 'preco_venda', 'preco_compra', 'descricao'],
    sellers: ['nome', 'comissao_padrao', 'telefone', 'email'],
    clients: ['nome', 'telefone'],
  }

  function handleTabChange(t: Tab) {
    setTab(t)
    setRawRows([])
    setFileName('')
    setDone(false)
    setEditingIndex(null)
  }

  function handleDownload() {
    if (tab === 'vehicles') downloadCSV('template_veiculos.csv', getVehicleTemplate())
    if (tab === 'sellers') downloadCSV('template_vendedores.csv', getSellerTemplate())
    if (tab === 'clients') downloadCSV('template_clientes.csv', getClientTemplate())
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setDone(false)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const rows = parseCSV(text).filter((r) =>
        Object.values(r).some((v) => v.trim() && !v.startsWith('#'))
      )
      setRawRows(rows)
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  function handleEditSave(updated: Record<string, string>) {
    if (editingIndex === null) return
    setRawRows((prev) => prev.map((r, i) => (i === editingIndex ? updated : r)))
    setEditingIndex(null)
  }

  function handleDelete(index: number) {
    setRawRows((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleImport() {
    setImporting(true)
    const now = new Date().toISOString()

    if (tab === 'vehicles') {
      for (const v of vehicleResult.vehicles) {
        const vehicle: Vehicle = {
          ...v,
          id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          dealershipId: currentDealershipId,
          images: [],
          createdAt: now,
          updatedAt: now,
          history: [{ id: `h-${Date.now()}`, date: now, action: 'created', description: 'Importado via CSV' }],
        }
        addVehicle(vehicle)
        await new Promise((r) => setTimeout(r, 50))
      }
    }

    if (tab === 'sellers') {
      for (const s of sellerResult.sellers) {
        const seller: Seller = {
          ...s,
          id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          dealershipId: currentDealershipId,
          defaultCommissionPercent: s.defaultCommissionPercent ?? defaultCommissionPercent,
        }
        addSeller(seller)
        await new Promise((r) => setTimeout(r, 50))
      }
    }

    if (tab === 'clients') {
      for (const c of clientResult.clients) {
        const client: Client = {
          ...c,
          id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          dealershipId: currentDealershipId,
        }
        addClient(client)
        await new Promise((r) => setTimeout(r, 50))
      }
    }

    setImporting(false)
    setDone(true)
    setRawRows([])
    setFileName('')
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'vehicles', label: 'Veículos', icon: <Car size={14} /> },
    { key: 'sellers', label: 'Vendedores', icon: <Users size={14} /> },
    { key: 'clients', label: 'Clientes', icon: <UserRound size={14} /> },
  ]

  return (
    <AppShell>
      <TopBar title="Importar CSV" showBack />

      <div className="px-4 pt-4 pb-6 flex flex-col gap-4">

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
              style={tab === t.key
                ? { backgroundColor: 'var(--ap-primary)', color: 'white' }
                : { border: '1px solid var(--ap-border)', backgroundColor: 'var(--ap-surface-2)', color: 'var(--ap-text-2)' }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Step 1 */}
        <div className="ap-card p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-ap-text-2 uppercase tracking-wide">1. Baixe o modelo</p>
          <p className="text-xs text-ap-text-3">
            Preencha o arquivo CSV com os dados e salve. Não remova nem renomeie as colunas.
          </p>
          <Button variant="secondary" onClick={handleDownload}>
            <Download size={14} className="mr-1.5" />
            Baixar template_{tab === 'vehicles' ? 'veiculos' : tab === 'sellers' ? 'vendedores' : 'clientes'}.csv
          </Button>
        </div>

        {/* Step 2 */}
        <div className="ap-card p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-ap-text-2 uppercase tracking-wide">2. Envie o arquivo preenchido</p>

          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed rounded-xl py-6 flex flex-col items-center gap-2 transition-colors"
            style={{ borderColor: 'var(--ap-border)', backgroundColor: 'var(--ap-surface-2)' }}
          >
            <Upload size={20} className="text-ap-text-3" />
            <span className="text-xs text-ap-text-2">
              {fileName ? fileName : 'Clique para selecionar o CSV'}
            </span>
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />

          {rawRows.length > 0 && errors.length > 0 && <ErrorList errors={errors} />}

          {hasData && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ap-text">
                  {previewCount} {tab === 'vehicles' ? 'veículo(s)' : tab === 'sellers' ? 'vendedor(es)' : 'cliente(s)'} encontrado(s)
                </p>
                <button onClick={() => { setRawRows([]); setFileName('') }}>
                  <X size={14} className="text-ap-text-3" />
                </button>
              </div>
              <PreviewTable
                headers={tabHeaders[tab]}
                rows={rawRows}
                onEdit={setEditingIndex}
                onDelete={handleDelete}
              />
            </div>
          )}
        </div>

        {/* Step 3 */}
        {hasData && !done && (
          <Button fullWidth onClick={handleImport} disabled={importing}>
            {importing ? 'Importando...' : `Importar ${previewCount} registro(s)`}
          </Button>
        )}

        {done && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--ap-surface-2)', border: '1px solid var(--ap-border)' }}>
            <CheckCircle size={20} className="text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-ap-text">Importação concluída!</p>
              <p className="text-xs text-ap-text-3">Os dados foram salvos e já estão disponíveis no sistema.</p>
            </div>
          </div>
        )}

      </div>

      {/* Edit sheet */}
      {editingIndex !== null && (
        <EditSheet
          headers={tabHeaders[tab]}
          row={rawRows[editingIndex]}
          onSave={handleEditSave}
          onClose={() => setEditingIndex(null)}
        />
      )}
    </AppShell>
  )
}
