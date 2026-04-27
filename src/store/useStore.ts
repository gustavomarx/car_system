'use client'

import { create } from 'zustand'
import { Vehicle, Seller, Client, Sale } from '@/types'
import {
  getVehicles, saveVehicle, patchVehicle, removeVehicle,
  getSellers, saveSeller, patchSeller,
  getClients, saveClient,
  getSales, saveSale, patchSale,
} from '@/lib/firestoreService'
import { seedFirestoreIfEmpty } from '@/lib/seedFirestore'

interface AppStore {
  vehicles: Vehicle[]
  sellers: Seller[]
  clients: Client[]
  sales: Sale[]
  isLoading: boolean
  currentDealershipId: string

  loadAllData: (dealershipId: string) => Promise<void>
  setCurrentDealershipId: (id: string) => void

  addVehicle: (v: Vehicle) => void
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void
  removeVehicle: (id: string) => void
  reserveVehicle: (id: string) => void
  unreserveVehicle: (id: string) => void

  addSeller: (s: Seller) => void
  updateSeller: (id: string, updates: Partial<Seller>) => void

  addClient: (c: Client) => void

  addSale: (s: Sale) => void
  updateSale: (id: string, updates: Partial<Sale>) => void
}

export const useStore = create<AppStore>((set, get) => ({
  vehicles: [],
  sellers: [],
  clients: [],
  sales: [],
  isLoading: true,
  currentDealershipId: 'd1',

  setCurrentDealershipId: (id) => set({ currentDealershipId: id }),

  loadAllData: async (dealershipId) => {
    set({ isLoading: true })

    async function doLoad() {
      await seedFirestoreIfEmpty(dealershipId)
      const [vehicles, sellers, clients, sales] = await Promise.all([
        getVehicles(dealershipId),
        getSellers(dealershipId),
        getClients(dealershipId),
        getSales(dealershipId),
      ])
      return { vehicles, sellers, clients, sales }
    }

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout após 5s')), 5000)
    )

    try {
      const data = await Promise.race([doLoad(), timeout])
      set({ ...data, isLoading: false })
    } catch (err) {
      console.error('[Store] loadAllData failed:', err)
      set({ isLoading: false })
    }
  },

  // ─── Vehicles ─────────────────────────────────────────────────────────────

  addVehicle: (v) => {
    set((state) => ({ vehicles: [v, ...state.vehicles] }))
    saveVehicle(v).catch(console.error)
  },

  updateVehicle: (id, updates) => {
    const now = new Date().toISOString()
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === id ? { ...v, ...updates, updatedAt: now } : v
      ),
    }))
    patchVehicle(id, { ...updates, updatedAt: now }).catch(console.error)
  },

  removeVehicle: (id) => {
    set((state) => ({ vehicles: state.vehicles.filter((v) => v.id !== id) }))
    removeVehicle(id).catch(console.error)
  },

  reserveVehicle: (id) => {
    const now = new Date().toISOString()
    const historyEntry = {
      id: `h-${Date.now()}`,
      date: now,
      action: 'reserved' as const,
      description: 'Veículo reservado',
    }
    set((state) => ({
      vehicles: state.vehicles.map((v) => {
        if (v.id !== id || v.status !== 'available') return v
        const updated = {
          ...v,
          status: 'reserved' as const,
          updatedAt: now,
          history: [...v.history, historyEntry],
        }
        patchVehicle(id, { status: updated.status, updatedAt: now, history: updated.history }).catch(console.error)
        return updated
      }),
    }))
  },

  unreserveVehicle: (id) => {
    const now = new Date().toISOString()
    const historyEntry = {
      id: `h-${Date.now()}`,
      date: now,
      action: 'unreserved' as const,
      description: 'Reserva removida',
    }
    set((state) => ({
      vehicles: state.vehicles.map((v) => {
        if (v.id !== id || v.status !== 'reserved') return v
        const updated = {
          ...v,
          status: 'available' as const,
          updatedAt: now,
          history: [...v.history, historyEntry],
        }
        patchVehicle(id, { status: updated.status, updatedAt: now, history: updated.history }).catch(console.error)
        return updated
      }),
    }))
  },

  // ─── Sellers ──────────────────────────────────────────────────────────────

  addSeller: (s) => {
    set((state) => ({ sellers: [...state.sellers, s] }))
    saveSeller(s).catch(console.error)
  },

  updateSeller: (id, updates) => {
    set((state) => ({
      sellers: state.sellers.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }))
    patchSeller(id, updates).catch(console.error)
  },

  // ─── Clients ──────────────────────────────────────────────────────────────

  addClient: (c) => {
    set((state) => ({ clients: [...state.clients, c] }))
    saveClient(c).catch(console.error)
  },

  // ─── Sales ────────────────────────────────────────────────────────────────

  addSale: (s) => {
    const now = new Date().toISOString()
    const historyEntry = {
      id: `h-${Date.now()}`,
      date: now,
      action: 'sold' as const,
      description: `Vendido por R$ ${s.finalPrice.toLocaleString('pt-BR')}`,
    }
    set((state) => ({
      sales: [...state.sales, s],
      vehicles: state.vehicles.map((v) => {
        if (v.id !== s.vehicleId) return v
        const updated = {
          ...v,
          status: 'sold' as const,
          updatedAt: now,
          history: [...v.history, historyEntry],
        }
        patchVehicle(v.id, { status: updated.status, updatedAt: now, history: updated.history }).catch(console.error)
        return updated
      }),
    }))
    saveSale(s).catch(console.error)
  },

  updateSale: (id, updates) => {
    set((state) => ({
      sales: state.sales.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }))
    patchSale(id, updates).catch(console.error)
  },
}))

// Expõe loadAllData para uso fora do hook (ex: DataProvider)
export function getLoadAllData() {
  return useStore.getState().loadAllData
}
