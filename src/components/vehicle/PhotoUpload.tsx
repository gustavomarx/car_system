'use client'

import { useState, useRef } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { ImageCropper } from './ImageCropper'
import { Camera, ImagePlus, X, GripVertical, Star, Loader2 } from 'lucide-react'
import { VehicleImage } from '@/types'
import { uploadVehiclePhoto, deleteVehiclePhoto } from '@/lib/storageService'

const PHOTO_SLOTS = [
  { label: 'Frontal', tip: 'Frente do veículo com boa iluminação' },
  { label: 'Diagonal', tip: 'Vista 3/4 dianteira' },
  { label: 'Interior', tip: 'Painel e bancos' },
  { label: 'Traseira', tip: 'Parte traseira completa' },
]

interface PhotoUploadProps {
  images: VehicleImage[]
  onChange: (images: VehicleImage[]) => void
  vehicleId: string
  dealershipId: string
}

export function PhotoUpload({ images, onChange, vehicleId, dealershipId }: PhotoUploadProps) {
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [pendingLabel, setPendingLabel] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  function openPicker(label: string, camera = false) {
    setPendingLabel(label)
    if (camera) {
      cameraInputRef.current?.click()
    } else {
      fileInputRef.current?.click()
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setCropSrc(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function handleCropConfirm(base64Url: string) {
    setUploading(true)
    setUploadError(null)
    try {
      const imgId = `img-${Date.now()}`
      const fileName = `${imgId}.jpg`
      let url: string
      try {
        url = await uploadVehiclePhoto(dealershipId, vehicleId, base64Url, fileName)
      } catch (storageErr) {
        console.error('[PhotoUpload] Firebase Storage upload failed, saving base64 as fallback:', storageErr)
        url = base64Url
        setUploadError('Falha no upload remoto — foto salva localmente (temporário).')
      }
      const newImg: VehicleImage = {
        id: imgId,
        url,
        label: pendingLabel,
        order: images.length,
      }
      onChange([...images, newImg])
    } catch (err) {
      console.error('[PhotoUpload] Unexpected error:', err)
      setUploadError('Erro ao processar a foto. Tente novamente.')
    } finally {
      setUploading(false)
      setCropSrc(null)
    }
  }

  function removeImage(id: string) {
    const img = images.find((i) => i.id === id)
    if (img && !img.url.startsWith('data:image')) {
      deleteVehiclePhoto(img.url).catch(console.error)
    }
    onChange(images.filter((i) => i.id !== id).map((i, idx) => ({ ...i, order: idx })))
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return
    const reordered = Array.from(images)
    const [moved] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)
    onChange(reordered.map((i, idx) => ({ ...i, order: idx })))
  }

  const coveredSlots = new Set(images.map((i) => i.label))

  return (
    <div>
      {/* Hidden inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

      {/* Sugestões de fotos */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {PHOTO_SLOTS.map((slot) => {
          const done = coveredSlots.has(slot.label)
          return (
            <button
              key={slot.label}
              type="button"
              onClick={() => openPicker(slot.label)}
              title={slot.tip}
              className={`relative h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${
                done
                  ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                  : 'active:opacity-80'
              }`}
              style={!done ? { borderColor: 'var(--ap-border)', backgroundColor: 'var(--ap-surface-2)' } : {}}
            >
              {done ? (
                <>
                  <span className="text-emerald-500 text-lg">✓</span>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{slot.label}</span>
                </>
              ) : (
                <>
                  <ImagePlus size={18} className="text-ap-text-3" />
                  <span className="text-xs text-ap-text-2 font-medium">{slot.label}</span>
                </>
              )}
            </button>
          )
        })}
      </div>

      {/* Indicador de upload */}
      {uploading && (
        <div className="flex items-center gap-2 mb-3 text-sm text-ap-text-2">
          <Loader2 size={15} className="animate-spin text-ap-primary" />
          Enviando foto para o servidor...
        </div>
      )}

      {/* Erro de upload */}
      {uploadError && (
        <div className="flex items-start gap-2 mb-3 p-3 rounded-xl text-xs text-amber-700 dark:text-amber-400"
          style={{ backgroundColor: 'var(--ap-surface-2)', border: '1px solid #f59e0b44' }}>
          <span className="shrink-0 mt-0.5">⚠️</span>
          <span>{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="ml-auto shrink-0 text-ap-text-3"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Botões de adição */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => openPicker('Foto extra', true)}
          className="flex-1 h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 active:opacity-80"
          style={{ backgroundColor: 'var(--ap-primary)' }}
        >
          <Camera size={16} />
          Tirar Foto
        </button>
        <button
          type="button"
          onClick={() => openPicker('Foto extra', false)}
          className="flex-1 h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:opacity-80 text-ap-text"
          style={{ border: '1px solid var(--ap-border)', backgroundColor: 'var(--ap-surface-2)' }}
        >
          <ImagePlus size={16} />
          Galeria
        </button>
      </div>

      {/* Imagens adicionadas — drag & drop vertical */}
      {images.length > 0 && (
        <>
          <p className="text-xs text-ap-text-3 mb-2 flex items-center gap-1">
            <GripVertical size={12} />
            Segure e arraste para reordenar · 1ª foto é a capa
          </p>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="photos" direction="vertical">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-col gap-2"
                >
                  {images.map((img, index) => (
                    <Draggable key={img.id} draggableId={img.id} index={index}>
                      {(drag, snapshot) => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          className="flex items-center gap-3 rounded-xl p-2 transition-shadow"
                          style={{
                            backgroundColor: 'var(--ap-surface)',
                            border: snapshot.isDragging
                              ? '1px solid var(--ap-primary)'
                              : '1px solid var(--ap-border)',
                            boxShadow: snapshot.isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                          }}
                        >
                          {/* Handle de drag */}
                          <div
                            {...drag.dragHandleProps}
                            className="p-1 text-ap-text-3 touch-none"
                          >
                            <GripVertical size={18} />
                          </div>

                          {/* Thumbnail */}
                          <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-ap-surface-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt={img.label ?? ''} className="w-full h-full object-cover" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            <p className="text-sm font-medium text-ap-text truncate">{img.label || 'Foto'}</p>
                            {index === 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-white px-1.5 py-0.5 rounded font-semibold shrink-0"
                                style={{ backgroundColor: 'var(--ap-primary)' }}>
                                <Star size={8} />
                                CAPA
                              </span>
                            )}
                          </div>

                          {/* Remover */}
                          <button
                            type="button"
                            onClick={() => removeImage(img.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-950/50 text-red-400 active:bg-red-100 shrink-0"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </>
      )}

      {/* Cropper modal */}
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </div>
  )
}
