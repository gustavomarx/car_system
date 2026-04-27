import { getDocs, collection, query, where, writeBatch, doc } from 'firebase/firestore'
import { db } from './firebase'
import { mockVehicles, mockSellers, mockClients, mockSales } from '@/data/mock'

/**
 * Populates Firestore with mock data if the dealership collections are empty.
 * Runs once on first load — safe to call on every boot.
 */
export async function seedFirestoreIfEmpty(dealershipId: string): Promise<void> {
  const vehicleSnap = await getDocs(
    query(collection(db, 'vehicles'), where('dealershipId', '==', dealershipId))
  )

  if (!vehicleSnap.empty) return

  const batch = writeBatch(db)

  for (const v of mockVehicles) {
    batch.set(doc(db, 'vehicles', v.id), v)
  }
  for (const s of mockSellers) {
    batch.set(doc(db, 'sellers', s.id), s)
  }
  for (const c of mockClients) {
    batch.set(doc(db, 'clients', c.id), c)
  }
  for (const sale of mockSales) {
    batch.set(doc(db, 'sales', sale.id), sale)
  }

  await batch.commit()
}
