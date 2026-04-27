import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { Vehicle, Seller, Client, Sale } from '@/types'

// ─── Vehicles ───────────────────────────────────────────────────────────────

export async function getVehicles(dealershipId: string): Promise<Vehicle[]> {
  const q = query(collection(db, 'vehicles'), where('dealershipId', '==', dealershipId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as Vehicle)
}

export async function saveVehicle(vehicle: Vehicle): Promise<void> {
  await setDoc(doc(db, 'vehicles', vehicle.id), vehicle)
}

export async function patchVehicle(id: string, updates: Partial<Vehicle>): Promise<void> {
  await updateDoc(doc(db, 'vehicles', id), updates as Record<string, unknown>)
}

export async function removeVehicle(id: string): Promise<void> {
  await deleteDoc(doc(db, 'vehicles', id))
}

// ─── Sellers ────────────────────────────────────────────────────────────────

export async function getSellers(dealershipId: string): Promise<Seller[]> {
  const q = query(collection(db, 'sellers'), where('dealershipId', '==', dealershipId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as Seller)
}

export async function saveSeller(seller: Seller): Promise<void> {
  await setDoc(doc(db, 'sellers', seller.id), seller)
}

export async function patchSeller(id: string, updates: Partial<Seller>): Promise<void> {
  await updateDoc(doc(db, 'sellers', id), updates as Record<string, unknown>)
}

// ─── Clients ────────────────────────────────────────────────────────────────

export async function getClients(dealershipId: string): Promise<Client[]> {
  const q = query(collection(db, 'clients'), where('dealershipId', '==', dealershipId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as Client)
}

export async function saveClient(client: Client): Promise<void> {
  await setDoc(doc(db, 'clients', client.id), client)
}

// ─── Sales ──────────────────────────────────────────────────────────────────

export async function getSales(dealershipId: string): Promise<Sale[]> {
  const q = query(collection(db, 'sales'), where('dealershipId', '==', dealershipId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as Sale)
}

export async function saveSale(sale: Sale): Promise<void> {
  await setDoc(doc(db, 'sales', sale.id), sale)
}

export async function patchSale(id: string, updates: Partial<Sale>): Promise<void> {
  await updateDoc(doc(db, 'sales', id), updates as Record<string, unknown>)
}
