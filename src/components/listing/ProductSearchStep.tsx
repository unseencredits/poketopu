'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Search, Loader2, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { searchCards, type TCGCard } from '@/lib/pokemon-tcg'
import type { Category } from '@/types'

interface Props {
  category: Category
  onSelect: (data: { productId?: string; card?: TCGCard; customTitle?: string; customDescription?: string }) => void
}

export default function ProductSearchStep({ category, onSelect }: Props) {
  const isCard = category === 'card' || category === 'graded'

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TCGCard[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<TCGCard | null>(null)
  const [searched, setSearched] = useState(false)

  const [customTitle, setCustomTitle] = useState('')
  const [customDesc, setCustomDesc] = useState('')

  const search = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    const { data } = await searchCards(query.trim())
    setResults(data)
    setLoading(false)
  }, [query])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') search()
  }

  function selectCard(card: TCGCard) {
    setSelected(card)
    onSelect({ productId: card.id, card })
  }

  if (!isCard) {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Ürün Bilgileri</h2>
        <p className="text-sm text-gray-500 mb-6">Ürünü tanımlayacak bilgileri gir</p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Ürün Başlığı</Label>
            <Input
              value={customTitle}
              onChange={e => setCustomTitle(e.target.value)}
              placeholder={category === 'sealed' ? 'ör. Scarlet & Violet Booster Box' : 'ör. Dragon Shield Matte Black Sleeves (100 adet)'}
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Açıklama <span className="text-gray-400">(isteğe bağlı)</span></Label>
            <Textarea
              value={customDesc}
              onChange={e => setCustomDesc(e.target.value)}
              placeholder="Ürün hakkında ekstra bilgi..."
              rows={3}
            />
          </div>
          <button
            onClick={() => customTitle.trim() && onSelect({ customTitle: customTitle.trim(), customDescription: customDesc.trim() })}
            disabled={!customTitle.trim()}
            className="w-full h-11 bg-primary text-white rounded-xl font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            Devam Et
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Kartı Bul</h2>
      <p className="text-sm text-gray-500 mb-6">Kart adını yaz, veritabanımızdan seç</p>

      {/* Arama */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ör. Charizard, Pikachu, Mewtwo..."
            className="pl-10 h-11"
          />
        </div>
        <button
          onClick={search}
          disabled={loading || !query.trim()}
          className="px-5 h-11 bg-primary text-white rounded-xl font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ara'}
        </button>
      </div>

      {/* Seçili kart */}
      {selected && (
        <div className="mb-4 p-3 rounded-xl border border-green-200 bg-green-50 flex items-center gap-3">
          <div className="relative h-12 w-9 flex-shrink-0">
            <Image src={selected.images.small} alt={selected.name} fill className="object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{selected.name}</p>
            <p className="text-xs text-gray-500">{selected.set.name} · #{selected.number}</p>
          </div>
          <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
        </div>
      )}

      {/* Sonuçlar */}
      {searched && !loading && (
        <div>
          {results.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">Sonuç bulunamadı. Farklı bir isim dene.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
              {results.map(card => (
                <button
                  key={card.id}
                  onClick={() => selectCard(card)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                    selected?.id === card.id
                      ? 'border-primary bg-red-50'
                      : 'border-gray-100 bg-white hover:border-primary/40 hover:bg-red-50/20'
                  }`}
                >
                  <div className="relative h-20 w-14">
                    <Image src={card.images.small} alt={card.name} fill className="object-contain" />
                  </div>
                  <div className="w-full">
                    <p className="text-xs font-semibold text-gray-900 text-center line-clamp-2 leading-tight">{card.name}</p>
                    <p className="text-xs text-gray-400 text-center mt-0.5 truncate">{card.set.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div className="text-center py-10 text-gray-300">
          <Search className="h-10 w-10 mx-auto mb-2" />
          <p className="text-sm">Kart adını yaz ve ara</p>
        </div>
      )}
    </div>
  )
}
