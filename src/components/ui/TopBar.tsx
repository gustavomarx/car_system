'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Menu } from 'lucide-react'
import { useDrawerStore } from '@/store/useDrawerStore'

interface TopBarProps {
  title: string
  showBack?: boolean
  right?: React.ReactNode
}

export function TopBar({ title, showBack, right }: TopBarProps) {
  const router = useRouter()
  const setOpen = useDrawerStore((s) => s.setOpen)

  return (
    <header
      className="sticky top-0 z-40 px-4 h-14 flex items-center gap-3"
      style={{
        backgroundColor: 'var(--ap-surface)',
        borderBottom: '1px solid var(--ap-border)',
      }}
    >
      {showBack && (
        <button
          onClick={() => router.back()}
          className="p-1.5 -ml-1.5 rounded-lg transition-colors active:opacity-70"
          style={{ color: 'var(--ap-text-2)' }}
        >
          <ArrowLeft size={20} />
        </button>
      )}
      <h1 className="flex-1 text-base font-semibold truncate" style={{ color: 'var(--ap-text)' }}>
        {title}
      </h1>
      {right && <div className="flex items-center gap-2">{right}</div>}
      {/* Hambúrguer — somente mobile */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-1.5 -mr-1.5 rounded-lg transition-colors active:opacity-70"
        style={{ color: 'var(--ap-text-2)' }}
        aria-label="Abrir menu"
      >
        <Menu size={22} />
      </button>
    </header>
  )
}
