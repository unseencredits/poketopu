'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SlidersHorizontal, ChevronRight, Check } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { TCGSet } from '@/lib/pokemon-tcg'

const SERIES_ORDER = [
  'Scarlet & Violet',
  'Sword & Shield',
  'Sun & Moon',
  'XY',
  'Black & White',
  'HeartGold & SoulSilver',
  'Platinum',
  'Diamond & Pearl',
  'EX',
  'e-Card',
  'Neo',
  'Gym',
  'Base',
]

interface Props {
  setsBySeries: Record<string, TCGSet[]>
  selectedSeri: string | null
  selectedSetId: string | null
  selectedSetName: string | null
}

export default function MobileFilter({ setsBySeries, selectedSeri, selectedSetId, selectedSetName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(selectedSeri)

  function go(url: string) {
    setOpen(false)
    router.push(url)
  }

  const triggerLabel = selectedSetName ?? selectedSeri ?? 'Seri & Set'
  const hasFilter = !!(selectedSeri || selectedSetId)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={`flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium transition-colors ${
          hasFilter
            ? 'bg-primary text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="truncate max-w-[140px]">{triggerLabel}</span>
      </SheetTrigger>

      <SheetContent side="bottom" showCloseButton className="max-h-[78vh] rounded-t-2xl p-0 gap-0">
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-gray-100">
          <SheetTitle className="text-base">Seri & Set Seç</SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(78vh - 60px)' }}>

          {/* Tümü */}
          <button
            onClick={() => go('/kartlar')}
            className={`w-full flex items-center justify-between px-4 py-3.5 text-sm border-b border-gray-50 transition-colors ${
              !selectedSeri && !selectedSetId
                ? 'text-primary font-semibold bg-red-50/50'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>Tüm Kartlar</span>
            {!selectedSeri && !selectedSetId && <Check className="h-4 w-4 text-primary" />}
          </button>

          {/* Seriler */}
          {SERIES_ORDER.filter(s => setsBySeries[s]).map(seri => {
            const sets = setsBySeries[seri] ?? []
            const isActiveSeri = selectedSeri === seri
            const isExpanded = expanded === seri

            return (
              <div key={seri} className="border-b border-gray-50">
                {/* Seri satırı */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : seri)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-sm transition-colors ${
                    isActiveSeri
                      ? 'text-primary font-semibold bg-red-50/50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{seri}</span>
                  <div className="flex items-center gap-2">
                    {isActiveSeri && !selectedSetId && <Check className="h-4 w-4 text-primary" />}
                    <ChevronRight
                      className={`h-4 w-4 text-gray-300 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </div>
                </button>

                {/* Setler (accordion) */}
                {isExpanded && (
                  <div className="bg-gray-50/70">
                    <button
                      onClick={() => go(`/kartlar?seri=${encodeURIComponent(seri)}`)}
                      className={`w-full flex items-center justify-between pl-8 pr-4 py-3 text-sm transition-colors ${
                        isActiveSeri && !selectedSetId
                          ? 'text-primary font-medium'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <span>Tüm {seri}</span>
                      {isActiveSeri && !selectedSetId && <Check className="h-4 w-4 text-primary" />}
                    </button>

                    {sets.map(set => (
                      <button
                        key={set.id}
                        onClick={() => go(`/kartlar?seri=${encodeURIComponent(seri)}&set_id=${set.id}`)}
                        className={`w-full flex items-center justify-between pl-8 pr-4 py-3 text-sm leading-snug transition-colors ${
                          selectedSetId === set.id
                            ? 'text-primary font-medium'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <span className="text-left">{set.name}</span>
                        {selectedSetId === set.id && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <div className="h-6" />
        </div>
      </SheetContent>
    </Sheet>
  )
}
