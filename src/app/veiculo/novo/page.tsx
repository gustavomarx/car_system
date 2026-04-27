'use client'

import { useState, useMemo } from 'react'
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
import { ChevronRight } from 'lucide-react'

function parseBRL(value: string): number {
  return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0
}

function formatBRL(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  const num = parseInt(digits, 10) / 100
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

const STEPS = ['Informações', 'Fotos', 'Detalhes']

interface StepBarProps {
  current: number
  quality: number
}

function StepBar({ current, quality }: StepBarProps) {
  const color =
    quality >= 80 ? 'bg-emerald-500' :
    quality >= 50 ? 'bg-amber-400' : 'bg-blue-500'

  return (
    <div className="sticky top-14 z-30 px-4 py-2 flex items-center gap-3"
      style={{ backgroundColor: 'var(--ap-surface)', borderBottom: '1px solid var(--ap-border)' }}>
      <div className="flex items-center gap-1 flex-1">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`flex items-center gap-1 ${i <= current ? 'text-ap-primary' : 'text-ap-text-3'}`}>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0`}
                style={i < current
                  ? { backgroundColor: 'var(--ap-primary)', color: 'white' }
                  : i === current
                    ? { border: '2px solid var(--ap-primary)', color: 'var(--ap-primary)', backgroundColor: 'transparent' }
                    : { border: '2px solid var(--ap-border)', color: 'var(--ap-text-3)', backgroundColor: 'transparent' }}
              >
                {i < current ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block`}
                style={{ color: i === current ? 'var(--ap-primary)' : i < current ? 'var(--ap-text-2)' : 'var(--ap-text-3)' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-4 shrink-0 ${i < current ? 'bg-ap-primary' : 'bg-ap-border'}`}
                style={{ backgroundColor: i < current ? 'var(--ap-primary)' : 'var(--ap-border)' }} />
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ap-surface-2)' }}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${quality}%` }}
          />
        </div>
        <span className="text-[10px] font-bold text-ap-text-2">{quality}%</span>
      </div>
    </div>
  )
}

export default function NovoVeiculoPage() {
  const router = useRouter()
  const { addVehicle, currentDealershipId } = useStore()

  // ID gerado uma única vez no mount — necessário para o upload de fotos antes do save
  const [vehicleId] = useState(() => `v-${Date.now()}`)

  const [step, setStep] = useState(0)
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [description, setDescription] = useState('')
  const [optionals, setOptionals] = useState<VehicleOptional[]>([])
  const [images, setImages] = useState<VehicleImage[]>([])

  const preview: Vehicle = useMemo(() => ({
    id: vehicleId,
    brand,
    model,
    year: parseInt(year) || 0,
    salePrice: parseBRL(salePrice),
    purchasePrice: parseBRL(purchasePrice),
    description,
    optionals,
    images,
    status: 'available',
    dealershipId: currentDealershipId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [],
  }), [brand, model, year, salePrice, purchasePrice, description, optionals, images])

  const quality = calcQualityScore(preview)

  function handleSave() {
    if (!brand || !model || !year || !salePrice) return
    addVehicle({
      ...preview,
      id: vehicleId,
      history: [
        {
          id: `h-${Date.now()}`,
          date: new Date().toISOString(),
          action: 'created',
          description: 'Veículo cadastrado no estoque',
        },
      ],
    })
    router.push('/estoque')
  }

  const step0Valid = !!(brand && model && year && salePrice)

  return (
    <AppShell>
      <TopBar title="Novo Veículo" showBack />
      <StepBar current={step} quality={quality} />

      <div className="px-4 pt-4 pb-6 flex flex-col gap-4">

        {/* ── ETAPA 0: Informações ── */}
        {step === 0 && (
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

            <Button fullWidth onClick={() => setStep(1)} disabled={!step0Valid}>
              Próximo: Fotos <ChevronRight size={16} />
            </Button>
          </div>
        )}

        {/* ── ETAPA 1: Fotos ── */}
        {step === 1 && (
          <>
            <div className="ap-card p-4">
              <h2 className="text-sm font-semibold text-ap-text mb-3">
                Fotos <span className="text-ap-text-3 font-normal">({images.length} adicionadas)</span>
              </h2>
              <PhotoUpload
                images={images}
                onChange={setImages}
                vehicleId={vehicleId}
                dealershipId={currentDealershipId}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(0)}>Voltar</Button>
              <Button fullWidth onClick={() => setStep(2)}>
                Próximo: Detalhes <ChevronRight size={16} />
              </Button>
            </div>
          </>
        )}

        {/* ── ETAPA 2: Detalhes finais ── */}
        {step === 2 && (
          <>
            <QualityScore score={quality} />

            <div className="ap-card p-4 flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-ap-text">Descrição</h2>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o estado, histórico de manutenção..."
                rows={5}
                className="ap-textarea"
              />
              <p className="text-xs text-ap-text-3 text-right">{description.length} caracteres</p>
            </div>

            <div className="ap-card p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ap-text">Opcionais</h2>
                {optionals.length > 0 && (
                  <span className="text-xs text-ap-primary font-medium">{optionals.length} selecionados</span>
                )}
              </div>
              <OptionalsSelector selected={optionals} onChange={setOptionals} />
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(1)}>Voltar</Button>
              <Button fullWidth size="lg" onClick={handleSave} disabled={!step0Valid}>
                Salvar Veículo
              </Button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
