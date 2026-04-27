'use client'

import { useUIStore } from '@/store/useUIStore'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { DrawerNav } from './DrawerNav'
import { Footer } from './Footer'

export function AppShell({ children }: { children: React.ReactNode }) {
  const viewMode = useUIStore((s) => s.viewMode)
  const isDesktop = viewMode === 'desktop'

  return (
    <div className={`flex min-h-screen ${isDesktop ? 'flex-row' : 'flex-col lg:flex-row'}`}>
      {/* Sidebar: visível no lg+ (auto) ou sempre (desktop forçado) */}
      <div className={isDesktop ? 'block' : 'hidden lg:block'}>
        <Sidebar />
      </div>

      {/* Conteúdo */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          isDesktop ? '' : 'max-w-lg mx-auto w-full lg:max-w-none lg:mx-0'
        }`}
      >
        <main className={`flex-1 ${isDesktop ? 'pb-4' : 'pb-20 lg:pb-4'}`}>
          {children}
        </main>

        <Footer />

        {!isDesktop && (
          <div className="lg:hidden">
            <BottomNav />
          </div>
        )}
      </div>

      {/* Drawer lateral — mobile only */}
      {!isDesktop && <DrawerNav />}
    </div>
  )
}
