'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Search, Loader2, Check, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { searchCards, getSets, type TCGCard, type TCGSet } from '@/lib/pokemon-tcg'
import type { Category } from '@/types'

interface Props {
  category: Category
  onSelect: (data: { productId?: string; card?: TCGCard; customTitle?: string; customDescription?: string }) => void
}

// Seriyi gruplamak için sabit sıra
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

export default function ProductSearchStep({ category, onSelect }: Props) {
  const isCard = category === 'card' || category === 'graded'

  const [query, setQuery] = useState('')
  const [selectedSetId, setSelectedSetId] = useState('')
  const [sets, setSets] = useState<TCGSet[]>([])
  const [results, setResults] = useState<TCGCard[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSets, setLoadingSets] = useState(true)
  const [selected, setSelected] = useState<TCGCard | null>(null)
  const [searched, setSearched] = useState(false)

  const [customTitle, setCustomTitle] = useState('')
  const [customDesc, setCustomDesc] = useState('')

  // Setleri yükle
  useEffect(() => {
    getSets().then(data => {
      setSets(data)
      setLoadingSets(false)
    })
  }, [])

  const search = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    const { data } = await searchCards(query.trim(), 1, selectedSetId || undefined)
    setResults(data)
    setLoading(false)
  }, [query, selectedSetId])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') search()
  }

  function selectCard(card: TCGCard) {
    setSelected(card)
    onSelect({ productId: card.id, card })
  }

  // Setleri seriye göre grupla
  const groupedSets = sets.reduce<Record<string, TCGSet[]>>((acc, set) => {
    const series = SERIES_ORDER.includes(set.series) ? set.series : 'Diğer'
    if (!acc[series]) acc[series] = []
    acc[series].push(set)
    return acc
  }, {})

  const orderedGroups = [
    ...SERIES_ORDER.filter(s => groupedSets[s]),
    ...(groupedSets['Diğer'] ? ['Diğer'] : []),
  ]

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
      <p className="text-sm text-gray-500 mb-5">Kart adı veya numarası ile ara — seti seçmek sonuçları daraltır</p>

      {/* Set seçici */}
      <div className="mb-3 relative">
        <div className="relative">
          <select
            value={selectedSetId}
            onChange={e => setSelectedSetId(e.target.value)}
            disabled={loadingSets}
            className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 pr-10 text-sm text-gray-700 focus:outline-none focus:border-primary focus:bg-white appearance-none transition-colors disabled:opacity-50"
          >
            <option value="">Tüm setler (isteğe bağlı)</option>
            {orderedGroups.map(series => (
              <optgroup key={series} label={series}>
                {(groupedSets[series] ?? []).map(set => (
                  <option key={set.id} value={set.id}>{set.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Arama alanı */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Charizard, Pikachu, 125/197..."
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
            <p className="font-semibold text-gray-900 text-sm truncate">
              {selected.name} <span className="text-gray-400 font-normal">#{selected.number}</span>
            </p>
            <p className="text-xs text-gray-500">{selected.set.name}</p>
          </div>
          <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
        </div>
      )}

      {/* Sonuçlar */}
      {searched && !loading && (
        <div>
          {results.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">Sonuç bulunamadı.</p>
              {selectedSetId && (
                <button
                  onClick={() => { setSelectedSetId(''); search() }}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  Set filtresini kaldırıp tekrar dene
                </button>
              )}
            </div>
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
                    <p className="text-xs font-semibold text-gray-900 text-center line-clamp-1 leading-tight">{card.name}</p>
                    <p className="text-xs text-gray-400 text-center mt-0.5 truncate">{card.set.name}</p>
                    <p className="text-[10px] text-gray-300 text-center">#{card.number}</p>
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
          <p className="text-sm">Kart adı veya numarası gir ve ara</p>
          {selectedSetId && (
            <p className="text-xs text-primary/60 mt-1">
              {sets.find(s => s.id === selectedSetId)?.name} setinde aranıyor
            </p>
          )}
        </div>
      )}
    </div>
  )
}
