'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, LayoutDashboard, Car, PlusCircle, Users, BarChart2, FileUp, Settings } from 'lucide-react'
import { useDrawerStore } from '@/store/useDrawerStore'
import { useUIStore } from '@/store/useUIStore'

const mainLinks = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/estoque', label: 'Estoque', icon: Car },
  { href: '/veiculo/novo', label: 'Novo Veículo', icon: PlusCircle },
  { href: '/vendedores', label: 'Equipe', icon: Users },
  { href: '/vendas', label: 'Vendas', icon: BarChart2 },
]

const secondaryLinks = [
  { href: '/importar', label: 'Importar CSV', icon: FileUp },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function DrawerNav() {
  const { open, setOpen } = useDrawerStore()
  const pathname = usePathname()
  const dealershipName = useUIStore((s) => s.dealershipName)

  // Fecha ao navegar
  useEffect(() => { setOpen(false) }, [pathname, setOpen])

  // Trava scroll do body quando aberto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Painel lateral — desliza da direita */}
      <aside
        className="relative ml-auto w-72 h-full flex flex-col shadow-2xl"
        style={{ backgroundColor: 'var(--ap-nav-bg)' }}
      >
        {/* Cabeçalho */}
        <div
          className="h-14 flex items-center justify-between px-4 shrink-0"
          style={{ borderBottom: '1px solid var(--ap-nav-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-ap-primary flex items-center justify-center">
              <Car size={15} className="text-white" />
            </div>
            <span className="font-bold text-ap-text text-sm truncate max-w-[160px]">
              {dealershipName}
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-xl transition-colors active:opacity-70"
            style={{ color: 'var(--ap-text-2)' }}
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Links principais */}
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {mainLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-ap-primary-sub text-ap-nav-active'
                    : 'text-ap-text-2 hover:bg-ap-surface-2 hover:text-ap-text'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Links secundários */}
        <div
          className="p-3 flex flex-col gap-1 shrink-0"
          style={{ borderTop: '1px solid var(--ap-nav-border)' }}
        >
          {secondaryLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-ap-primary-sub text-ap-nav-active'
                    : 'text-ap-text-2 hover:bg-ap-surface-2 hover:text-ap-text'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                {label}
              </Link>
            )
          })}
        </div>
      </aside>
    </div>
  )
}
