'use client'

import { use, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/ui/AppShell'
import { TopBar } from '@/components/ui/TopBar'
import { Button } from '@/components/ui/Button'
import { PhotoUpload } from '@/components/vehicle/PhotoUpload'
import { QualityScore } from '@/components/vehicle/QualityScore'
import { OptionalsSelector } from '@/components/vehicle/OptionalsSelector'
import { useStore } from '@/store/useStore'
import { calcQualityScore } from '@/lib/vehicle-utils'
import { Vehicle, VehicleImage, VehicleOptional } from '@/types'

function parseBRL(value: string): number {
  return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0
}

function formatBRL(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  const num = parseInt(digits, 10) / 100
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

function numToBRL(num: number): string {
  if (!num) return ''
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

interface Props {
  params: Promise<{ id: string }>
}

export default function EditarVeiculoPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const { vehicles, updateVehicle } = useStore()

  const vehicle = vehicles.find((v) => v.id === id)

  const [brand, setBrand] = useState(vehicle?.brand ?? '')
  const [model, setModel] = useState(vehicle?.model ?? '')
  const [year, setYear] = useState(vehicle?.year ? String(vehicle.year) : '')
  const [salePrice, setSalePrice] = useState(numToBRL(vehicle?.salePrice ?? 0))
  const [purchasePrice, setPurchasePrice] = useState(numToBRL(vehicle?.purchasePrice ?? 0))
  const [description, setDescription] = useState(vehicle?.description ?? '')
  const [optionals, setOptionals] = useState<VehicleOptional[]>(vehicle?.optionals ?? [])
  const [images, setImages] = useState<VehicleImage[]>(vehicle?.images ?? [])

  const preview: Vehicle = useMemo(() => ({
    id: id,
    brand,
    model,
    year: parseInt(year) || 0,
    salePrice: parseBRL(salePrice),
    purchasePrice: parseBRL(purchasePrice),
    description,
    optionals,
    images,
    status: vehicle?.status ?? 'available',
    dealershipId: 'd1',
    createdAt: vehicle?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: vehicle?.history ?? [],
  }), [id, brand, model, year, salePrice, purchasePrice, description, optionals, images, vehicle])

  const quality = calcQualityScore(preview)

  if (!vehicle) {
    return (
      <AppShell>
        <TopBar title="Editar Veículo" showBack />
        <div className="flex items-center justify-center h-64 text-ap-text-3">Veículo não encontrado</div>
      </AppShell>
    )
  }

  function handleSave() {
    const historyEntry = {
      id: `h-${Date.now()}`,
      date: new Date().toISOString(),
      action: 'edited' as const,
      description: 'Dados do veículo atualizados',
    }

    updateVehicle(id, {
      brand,
      model,
      year: parseInt(year) || (vehicle?.year ?? 0),
      salePrice: parseBRL(salePrice),
      purchasePrice: parseBRL(purchasePrice) || undefined,
      description,
      optionals,
      images,
      history: [...(vehicle?.history ?? []), historyEntry],
    })

    router.replace(`/veiculo/${id}`)
  }

  const canSave = !!(brand && model && year && salePrice)

  return (
    <AppShell>
      <TopBar title="Editar Veículo" showBack />

      {/* Mini quality sticky */}
      <div className="sticky top-14 z-30 px-4 py-2 flex items-center justify-between"
        style={{ backgroundColor: 'var(--ap-surface)', borderBottom: '1px solid var(--ap-border)' }}>
        <span className="text-xs text-ap-text-2 font-medium">Qualidade do anúncio</span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ap-surface-2)' }}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                quality >= 80 ? 'bg-emerald-500' :
                quality >= 50 ? 'bg-amber-400' : 'bg-blue-500'
              }`}
              style={{ width: `${quality}%` }}
            />
          </div>
          <span className="text-xs font-bold text-ap-text-2">{quality}%</span>
        </div>
      </div>

      <div className="px-4 pt-4 pb-6 flex flex-col gap-4">
        <QualityScore score={quality} />

        {/* Dados básicos */}
        <div className="ap-card p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ap-text">Dados do Veículo</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ap-text-2 font-medium mb-1 block">Marca *</label>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Toyota"
                className="ap-input"
              />
            </div>
            <div>
              <label className="text-xs text-ap-text-2 font-medium mb-1 block">Modelo *</label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Corolla"
                className="ap-input"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-ap-text-2 font-medium mb-1 block">Ano *</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2022"
              className="ap-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ap-text-2 font-medium mb-1 block">Preço de Venda *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ap-text-3 text-sm pointer-events-none">R$</span>
                <input
                  value={salePrice}
                  onChange={(e) => setSalePrice(formatBRL(e.target.value))}
                  placeholder="0,00"
                  inputMode="numeric"
                  className="ap-input"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-ap-text-2 font-medium mb-1 block">Preço de Compra</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ap-text-3 text-sm pointer-events-none">R$</span>
                <input
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(formatBRL(e.target.value))}
                  placeholder="0,00"
                  inputMode="numeric"
                  className="ap-input"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-ap-text-2 font-medium mb-1 block">
              Descrição <span className="text-ap-text-3">({description.length} chars)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o estado, opcionais, histórico de manutenção..."
              rows={4}
              className="ap-textarea"
            />
          </div>
        </div>

        {/* Opcionais */}
        <div className="ap-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ap-text">Opcionais</h2>
            {optionals.length > 0 && (
              <span className="text-xs text-ap-primary font-medium">{optionals.length} selecionados</span>
            )}
          </div>
          <OptionalsSelector selected={optionals} onChange={setOptionals} />
        </div>

        {/* Fotos */}
        <div className="ap-card p-4">
          <h2 className="text-sm font-semibold text-ap-text mb-3">
            Fotos <span className="text-ap-text-3 font-normal">({images.length} adicionadas)</span>
          </h2>
          <PhotoUpload
            images={images}
            onChange={setImages}
            vehicleId={id}
            dealershipId={vehicle.dealershipId}
          />
        </div>

        <Button fullWidth size="lg" onClick={handleSave} disabled={!canSave}>
          Salvar Alterações
        </Button>
      </div>
    </AppShell>
  )
}
