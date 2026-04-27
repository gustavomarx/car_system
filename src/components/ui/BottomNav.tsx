'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Car, PlusCircle, Users, BarChart2 } from 'lucide-react'

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/estoque', label: 'Estoque', icon: Car },
  { href: '/veiculo/novo', label: 'Adicionar', icon: PlusCircle, primary: true },
  { href: '/vendedores', label: 'Equipe', icon: Users },
  { href: '/vendas', label: 'Vendas', icon: BarChart2 },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb"
      style={{
        backgroundColor: 'var(--ap-nav-bg)',
        borderTop: '1px solid var(--ap-nav-border)',
      }}
    >
      <div className="flex items-center justify-around h-16">
        {links.map(({ href, label, icon: Icon, primary }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          const color = active || primary ? 'var(--ap-nav-active)' : 'var(--ap-nav-idle)'
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-opacity active:opacity-70"
              style={{ color }}
            >
              <Icon size={primary ? 26 : 20} strokeWidth={active || primary ? 2.5 : 1.8} />
              <span className="text-[9px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
