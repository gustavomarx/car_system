import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'
export type ViewMode = 'auto' | 'desktop'
export type StockView = 'card' | 'list' | 'detail'

interface UIStore {
  theme: Theme
  viewMode: ViewMode
  stockView: StockView
  setTheme: (t: Theme) => void
  setViewMode: (m: ViewMode) => void
  setStockView: (v: StockView) => void

  // Dados da loja — persistidos localmente
  // TODO: conectar ao backend quando auth multi-tenant for implementado
  dealershipName: string
  defaultCommissionPercent: number
  setDealershipName: (name: string) => void
  setDefaultCommissionPercent: (v: number) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'system',
      viewMode: 'auto',
      stockView: 'card',
      setTheme: (theme) => set({ theme }),
      setViewMode: (viewMode) => set({ viewMode }),
      setStockView: (stockView) => set({ stockView }),

      dealershipName: 'Auto Premium',
      defaultCommissionPercent: 3,
      setDealershipName: (dealershipName) => set({ dealershipName }),
      setDefaultCommissionPercent: (defaultCommissionPercent) => set({ defaultCommissionPercent }),
    }),
    { name: 'ap-ui' }
  )
)
