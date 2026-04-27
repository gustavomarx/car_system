import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'

/**
 * Uploads a vehicle photo (Blob or base64 data URL) to Firebase Storage.
 * Path: vehicles/{dealershipId}/{vehicleId}/{fileName}
 * Returns the public download URL.
 */
export async function uploadVehiclePhoto(
  dealershipId: string,
  vehicleId: string,
  file: Blob | string,
  fileName: string
): Promise<string> {
  const path = `vehicles/${dealershipId}/${vehicleId}/${fileName}`
  const storageRef = ref(storage, path)

  let blob: Blob
  if (typeof file === 'string') {
    const res = await fetch(file)
    blob = await res.blob()
  } else {
    blob = file
  }

  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
  return getDownloadURL(storageRef)
}

/**
 * Deletes a photo from Firebase Storage by its download URL.
 * Safe to call even if the file no longer exists.
 */
export async function deleteVehiclePhoto(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url)
    await deleteObject(storageRef)
  } catch {
    // Already deleted or not a Storage URL — ignore
  }
}
