'use client'

import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { migrateBase64ToStorage } from '@/lib/migratePhotos'

export function DataProvider({ children }: { children: React.ReactNode }) {
  const loadAllData = useStore((s) => s.loadAllData)
  const currentDealershipId = useStore((s) => s.currentDealershipId)
  const isLoading = useStore((s) => s.isLoading)

  useEffect(() => {
    loadAllData(currentDealershipId).then(() => {
      migrateBase64ToStorage().catch(console.error)
    })
  }, [currentDealershipId, loadAllData])

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Carregando dados...</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
