'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react'

interface Area {
  x: number
  y: number
  width: number
  height: number
}

const MAX_DIMENSION = 1200
const JPEG_QUALITY = 0.85

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.src = imageSrc
  })

  // Compressão leve: limita a dimensão máxima a MAX_DIMENSION px
  const scale = Math.min(1, MAX_DIMENSION / Math.max(pixelCrop.width, pixelCrop.height))
  const outputWidth = Math.round(pixelCrop.width * scale)
  const outputHeight = Math.round(pixelCrop.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = outputHeight
  const ctx = canvas.getContext('2d')!

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight
  )

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}

interface ImageCropperProps {
  src: string
  onConfirm: (croppedUrl: string) => void
  onCancel: () => void
}

export function ImageCropper({ src, onConfirm, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  const onCropComplete = useCallback((_: unknown, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleConfirm() {
    if (!croppedAreaPixels || saving) return
    setSaving(true)
    const url = await getCroppedImg(src, croppedAreaPixels)
    onConfirm(url)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 bg-black/80 text-white shrink-0">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-sm text-white/70 active:text-white p-1"
        >
          <X size={18} />
          Cancelar
        </button>
        <p className="text-sm font-semibold">Enquadrar foto (4:3)</p>
        <div className="w-20" />
      </div>

      {/* Crop area */}
      <div className="relative flex-1">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={4 / 3}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{ containerStyle: { background: '#000' } }}
        />
      </div>

      {/* Zoom */}
      <div className="bg-black/90 px-6 py-3 shrink-0 flex items-center gap-3">
        <button onClick={() => setZoom(Math.max(1, zoom - 0.1))} className="text-white/60 active:text-white p-1">
          <ZoomOut size={18} />
        </button>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: 'var(--ap-primary)' }}
        />
        <button onClick={() => setZoom(Math.min(3, zoom + 0.1))} className="text-white/60 active:text-white p-1">
          <ZoomIn size={18} />
        </button>
      </div>

      {/* Botão salvar — grande, área de toque generosa */}
      <div className="bg-black px-4 pt-3 pb-8 shrink-0">
        <button
          onClick={handleConfirm}
          disabled={saving}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 text-white font-semibold text-base transition-opacity disabled:opacity-50"
          style={{ backgroundColor: 'var(--ap-primary)' }}
        >
          <Check size={20} strokeWidth={2.5} />
          {saving ? 'Salvando...' : 'Salvar Foto'}
        </button>
      </div>
    </div>
  )
}
