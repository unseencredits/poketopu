'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, GripVertical, ImagePlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const MAX_PHOTOS = 4

interface Props {
  userId: string
  onNext: (photoUrls: string[]) => void
}

export default function PhotoUploadStep({ userId, onNext }: Props) {
  const [photos, setPhotos] = useState<{ file?: File; url: string; uploading?: boolean }[]>([])
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files) return
    const remaining = MAX_PHOTOS - photos.length
    const newFiles = Array.from(files).slice(0, remaining)
    if (!newFiles.length) return

    setUploading(true)
    const supabase = createClient()

    const uploaded: string[] = []
    for (const file of newFiles) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await supabase.storage.from('listings').upload(path, file)
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from('listings').getPublicUrl(data.path)
        uploaded.push(publicUrl)
      }
    }

    setPhotos(prev => [
      ...prev,
      ...uploaded.map(url => ({ url })),
    ])
    setUploading(false)
  }

  function removePhoto(idx: number) {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Fotoğraf Ekle</h2>
      <p className="text-sm text-gray-500 mb-6">
        En fazla {MAX_PHOTOS} fotoğraf. İlk fotoğraf kapak olarak kullanılır.
      </p>

      {/* Yükleme alanı */}
      {photos.length < MAX_PHOTOS && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-red-50/20 transition-all mb-4"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Yükleniyor...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                <ImagePlus className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-gray-600">Fotoğraf seç veya sürükle bırak</p>
              <p className="text-xs text-gray-400">JPG, PNG, WEBP · Maks 5MB · {MAX_PHOTOS - photos.length} slot kaldı</p>
            </div>
          )}
        </div>
      )}

      {/* Fotoğraf önizleme */}
      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-6">
          {photos.map((photo, idx) => (
            <div key={photo.url} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
              <Image src={photo.url} alt={`Fotoğraf ${idx + 1}`} fill className="object-cover" />
              {idx === 0 && (
                <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium">
                  Kapak
                </div>
              )}
              <button
                onClick={() => removePhoto(idx)}
                className="absolute top-1.5 right-1.5 h-6 w-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {Array.from({ length: MAX_PHOTOS - photos.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-100 flex items-center justify-center cursor-pointer hover:border-primary/30 transition-colors"
            >
              <Upload className="h-4 w-4 text-gray-300" />
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => onNext(photos.map(p => p.url))}
        disabled={uploading}
        className="w-full h-11 bg-primary text-white rounded-xl font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
      >
        {photos.length === 0 ? 'Fotoğrafsız Devam Et' : `${photos.length} Fotoğrafla Devam Et`}
      </button>
    </div>
  )
}
