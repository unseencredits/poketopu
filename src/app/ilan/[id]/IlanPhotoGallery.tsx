'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  photos: string[]
  alt: string
}

export default function IlanPhotoGallery({ photos, alt }: Props) {
  const [current, setCurrent] = useState(0)

  if (!photos.length) {
    return (
      <div className="relative w-full max-w-xs bg-gray-50 rounded-2xl border border-gray-100 mx-auto flex items-center justify-center" style={{ aspectRatio: '5/7' }}>
        <div className="w-24 h-32 rounded-xl bg-gray-200" />
      </div>
    )
  }

  function prev() { setCurrent(i => (i - 1 + photos.length) % photos.length) }
  function next() { setCurrent(i => (i + 1) % photos.length) }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Ana görsel */}
      <div className="relative w-full max-w-xs mx-auto" style={{ aspectRatio: '5/7' }}>
        <div className="relative w-full h-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
          <Image
            src={photos[current]}
            alt={`${alt} — fotoğraf ${current + 1}`}
            fill
            className="object-contain p-4"
            priority
          />
        </div>

        {photos.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 border border-gray-100 shadow-sm flex items-center justify-center hover:bg-white transition-colors z-10"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 border border-gray-100 shadow-sm flex items-center justify-center hover:bg-white transition-colors z-10"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>

            {/* Sayfa göstergesi */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === current ? 'w-4 bg-primary' : 'w-1.5 bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail şeridi */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((url, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`relative flex-shrink-0 w-14 rounded-xl overflow-hidden border-2 transition-colors ${
                i === current ? 'border-primary' : 'border-gray-100 hover:border-gray-300'
              }`}
              style={{ aspectRatio: '5/7' }}
            >
              <Image src={url} alt={`Fotoğraf ${i + 1}`} fill className="object-contain p-1 bg-gray-50" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
