'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Car, PlusCircle, Users, BarChart2, Settings, FileUp } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/estoque', label: 'Estoque', icon: Car },
  { href: '/veiculo/novo', label: 'Novo Veículo', icon: PlusCircle },
  { href: '/vendedores', label: 'Equipe', icon: Users },
  { href: '/vendas', label: 'Vendas', icon: BarChart2 },
]

export function Sidebar() {
  const pathname = usePathname()
  const dealershipName = useUIStore((s) => s.dealershipName)

  return (
    <aside
      className="w-64 shrink-0 h-screen sticky top-0 flex flex-col"
      style={{ backgroundColor: 'var(--ap-nav-bg)', borderRight: '1px solid var(--ap-nav-border)' }}
    >
      {/* Brand */}
      <div className="h-14 flex items-center px-5" style={{ borderBottom: '1px solid var(--ap-nav-border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-ap-primary flex items-center justify-center">
            <Car size={15} className="text-white" />
          </div>
          <span className="font-bold text-ap-text text-sm truncate">{dealershipName}</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 h-10 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-ap-primary-sub text-ap-nav-active'
                  : 'text-ap-text-2 hover:bg-ap-surface-2 hover:text-ap-text'
              }`}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom links */}
      <div className="p-3 flex flex-col gap-1" style={{ borderTop: '1px solid var(--ap-nav-border)' }}>
        {[
          { href: '/importar', label: 'Importar CSV', icon: FileUp },
          { href: '/configuracoes', label: 'Configurações', icon: Settings },
        ].map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 h-10 rounded-xl text-sm font-medium transition-colors ${
                active ? 'bg-ap-primary-sub text-ap-nav-active' : 'text-ap-text-2 hover:bg-ap-surface-2 hover:text-ap-text'
              }`}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
