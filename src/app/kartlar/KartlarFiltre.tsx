'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { CONDITIONS } from '@/types'
import type { Condition } from '@/types'

const CONDITIONS_LIST: Condition[] = ['NM', 'LP', 'MP', 'HP', 'D']

const SORT_OPTIONS = [
  { value: '', label: 'En Çok İlan' },
  { value: 'fiyat-asc', label: 'Ucuzdan Pahalıya' },
  { value: 'fiyat-desc', label: 'Pahalıdan Ucuza' },
]

export default function KartlarFiltre() {
  const router = useRouter()
  const sp = useSearchParams()
  const [open, setOpen] = useState(false)

  const currentKondisyon = sp.get('kondisyon') ?? ''
  const currentSirala = sp.get('sirala') ?? ''
  const currentMin = sp.get('min') ?? ''
  const currentMax = sp.get('max') ?? ''

  const [kondisyon, setKondisyon] = useState(currentKondisyon)
  const [sirala, setSirala] = useState(currentSirala)
  const [min, setMin] = useState(currentMin)
  const [max, setMax] = useState(currentMax)

  const activeCount = [currentKondisyon, currentSirala, currentMin, currentMax].filter(Boolean).length

  function apply() {
    const params = new URLSearchParams(sp.toString())
    if (kondisyon) params.set('kondisyon', kondisyon); else params.delete('kondisyon')
    if (sirala) params.set('sirala', sirala); else params.delete('sirala')
    if (min) params.set('min', min); else params.delete('min')
    if (max) params.set('max', max); else params.delete('max')
    setOpen(false)
    router.push(`/kartlar?${params.toString()}`)
  }

  function reset() {
    setKondisyon('')
    setSirala('')
    setMin('')
    setMax('')
    const params = new URLSearchParams(sp.toString())
    params.delete('kondisyon')
    params.delete('sirala')
    params.delete('min')
    params.delete('max')
    setOpen(false)
    router.push(`/kartlar?${params.toString()}`)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={`gap-2 rounded-xl relative ${activeCount > 0 ? 'border-primary text-primary' : ''}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtrele
            {activeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </Button>
        }
      />
      <SheetContent side="right" className="w-72 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <p className="font-semibold text-gray-900">Filtreler</p>
          {activeCount > 0 && (
            <button onClick={reset} className="text-xs text-gray-400 hover:text-primary flex items-center gap-1">
              <X className="h-3 w-3" /> Temizle
            </button>
          )}
        </div>

        {/* Sıralama */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Sıralama</p>
          <div className="space-y-1">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSirala(opt.value)}
                className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${
                  sirala === opt.value ? 'bg-red-50 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Kondisyon */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Kondisyon</p>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS_LIST.map(c => (
              <button
                key={c}
                onClick={() => setKondisyon(kondisyon === c ? '' : c)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  kondisyon === c
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {c} · {CONDITIONS[c].label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Fiyat aralığı */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Fiyat (₺)</p>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="Min"
              value={min}
              onChange={e => setMin(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
            <span className="text-gray-400 text-sm">—</span>
            <input
              type="number"
              placeholder="Max"
              value={max}
              onChange={e => setMax(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <Button onClick={apply} className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl">
          Uygula
        </Button>
      </SheetContent>
    </Sheet>
  )
}
