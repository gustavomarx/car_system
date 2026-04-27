'use client'

import { useState } from 'react'
import { AppShell } from '@/components/ui/AppShell'
import { TopBar } from '@/components/ui/TopBar'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/store/useUIStore'
import { Sun, Moon, Monitor as DesktopIcon, Smartphone, Store, Check } from 'lucide-react'

type OptionItem<T> = { value: T; label: string; icon: React.ReactNode }

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: OptionItem<T>[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-ap-text-2 font-semibold uppercase tracking-wide">{label}</p>
      <div className="flex gap-2">
        {options.map((opt) => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold transition-all"
              style={active
                ? { backgroundColor: 'var(--ap-primary)', color: 'white' }
                : { border: '1px solid var(--ap-border)', backgroundColor: 'var(--ap-surface-2)', color: 'var(--ap-text-2)' }}
            >
              {opt.icon}
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ConfiguracoesPage() {
  const {
    theme, viewMode,
    setTheme, setViewMode,
    dealershipName, defaultCommissionPercent,
    setDealershipName, setDefaultCommissionPercent,
  } = useUIStore()

  const [localName, setLocalName] = useState(dealershipName)
  const [localCommission, setLocalCommission] = useState(String(defaultCommissionPercent))
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setDealershipName(localName.trim() || 'Auto Premium')
    setDefaultCommissionPercent(parseFloat(localCommission) || 0)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const themeOptions: OptionItem<'light' | 'dark'>[] = [
    { value: 'light', label: 'Claro', icon: <Sun size={18} /> },
    { value: 'dark', label: 'Escuro', icon: <Moon size={18} /> },
  ]

  const layoutOptions: OptionItem<typeof viewMode>[] = [
    { value: 'auto', label: 'Automático', icon: <Smartphone size={18} /> },
    { value: 'desktop', label: 'Desktop', icon: <DesktopIcon size={18} /> },
  ]

  return (
    <AppShell>
      <TopBar title="Configurações" showBack />

      <div className="px-4 pt-4 pb-6 flex flex-col gap-4">

        {/* Dados da loja */}
        <div className="ap-card p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Store size={15} className="text-ap-primary" />
            <p className="text-sm font-semibold text-ap-text">Dados da Loja</p>
          </div>

          <div>
            <label className="text-xs text-ap-text-2 font-medium mb-1 block">Nome da loja</label>
            <input
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="Auto Premium"
              className="ap-input"
            />
          </div>

          <div>
            <label className="text-xs text-ap-text-2 font-medium mb-1 block">Comissão padrão (%)</label>
            <div className="relative">
              <input
                type="number"
                value={localCommission}
                onChange={(e) => setLocalCommission(e.target.value)}
                step="0.5"
                min="0"
                max="100"
                className="ap-input"
                style={{ paddingRight: '2rem' }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ap-text-3 text-sm">%</span>
            </div>
            <p className="text-xs text-ap-text-3 mt-1">
              Usada como padrão ao cadastrar novos vendedores.
            </p>
          </div>

          <Button fullWidth onClick={handleSave}>
            {saved ? (
              <><Check size={15} className="mr-1.5" /> Salvo!</>
            ) : (
              'Salvar'
            )}
          </Button>
        </div>

        {/* Aparência */}
        <div className="ap-card p-4 flex flex-col gap-5">
          <OptionGroup
            label="Tema"
            options={themeOptions}
            value={theme === 'system' ? 'light' : theme}
            onChange={(v: 'light' | 'dark') => setTheme(v)}
          />
          <div style={{ borderTop: '1px solid var(--ap-border)' }} className="pt-4">
            <OptionGroup
              label="Layout"
              options={layoutOptions}
              value={viewMode}
              onChange={setViewMode}
            />
            <p className="text-xs text-ap-text-3 mt-2">
              Automático usa sidebar em telas grandes. Desktop força sidebar sempre.
            </p>
          </div>
        </div>

      </div>
    </AppShell>
  )
}
