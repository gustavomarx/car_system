import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from './firebase'
import { uploadVehiclePhoto } from './storageService'
import { Vehicle, VehicleImage } from '@/types'

/**
 * One-time migration: uploads base64 images to Firebase Storage
 * and replaces the base64 URLs in Firestore with Storage download URLs.
 *
 * Safe to call multiple times — only processes images that still contain base64.
 * Remove the call from DataProvider once all images have been migrated.
 */
export async function migrateBase64ToStorage(): Promise<void> {
  const snap = await getDocs(collection(db, 'vehicles'))

  for (const vehicleDoc of snap.docs) {
    const vehicle = vehicleDoc.data() as Vehicle
    const images: VehicleImage[] = vehicle.images ?? []

    const hasBase64 = images.some((img) => img.url.startsWith('data:image'))
    if (!hasBase64) continue

    console.log(`[migratePhotos] Migrating ${images.length} image(s) for vehicle ${vehicle.id}`)

    const migratedImages: VehicleImage[] = await Promise.all(
      images.map(async (img) => {
        if (!img.url.startsWith('data:image')) return img

        try {
          const fileName = `${img.id}.jpg`
          const url = await uploadVehiclePhoto(vehicle.dealershipId, vehicle.id, img.url, fileName)
          console.log(`[migratePhotos]   ✓ ${img.id} → ${url}`)
          return { ...img, url }
        } catch (err) {
          console.error(`[migratePhotos]   ✗ Failed to migrate ${img.id}:`, err)
          return img
        }
      })
    )

    await updateDoc(doc(db, 'vehicles', vehicle.id), { images: migratedImages })
    console.log(`[migratePhotos] Done: vehicle ${vehicle.id}`)
  }
}
