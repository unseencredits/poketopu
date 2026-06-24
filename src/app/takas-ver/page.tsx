'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronLeft, Search, Loader2, X, Plus, ArrowRightLeft, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { searchCards, getSets, type TCGCard, type TCGSet } from '@/lib/pokemon-tcg'
import { CONDITIONS, type Condition } from '@/types'

type TradeType = 'have' | 'want'
type Step = 'type' | 'cards' | 'publishing'

interface TradeItem {
  card: TCGCard
  condition: Condition | null
  notes: string
}

const SERIES_ORDER = [
  'Scarlet & Violet', 'Sword & Shield', 'Sun & Moon', 'XY',
  'Black & White', 'HeartGold & SoulSilver', 'Platinum',
  'Diamond & Pearl', 'EX', 'e-Card', 'Neo', 'Gym', 'Base',
]

export default function TakasVerPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('type')
  const [tradeType, setTradeType] = useState<TradeType | null>(null)
  const [items, setItems] = useState<TradeItem[]>([])
  const [error, setError] = useState<string | null>(null)

  // Search state
  const [query, setQuery] = useState('')
  const [selectedSetId, setSelectedSetId] = useState('')
  const [sets, setSets] = useState<TCGSet[]>([])
  const [loadingSets, setLoadingSets] = useState(true)
  const [results, setResults] = useState<TCGCard[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/giris?redirect=/takas-ver'); return }
      setUserId(user.id)
    }
    init()
    getSets().then(data => { setSets(data); setLoadingSets(false) })
  }, [router])

  const search = useCallback(async () => {
    if (!query.trim()) return
    setSearching(true)
    setSearched(true)
    const { data } = await searchCards(query.trim(), 1, selectedSetId || undefined)
    setResults(data)
    setSearching(false)
  }, [query, selectedSetId])

  function addCard(card: TCGCard) {
    if (items.find(i => i.card.id === card.id)) return
    setItems(prev => [...prev, { card, condition: null, notes: '' }])
    setResults([])
    setQuery('')
    setSearched(false)
  }

  function removeItem(cardId: string) {
    setItems(prev => prev.filter(i => i.card.id !== cardId))
  }

  function updateCondition(cardId: string, condition: Condition | null) {
    setItems(prev => prev.map(i => i.card.id === cardId ? { ...i, condition } : i))
  }

  function updateNotes(cardId: string, notes: string) {
    setItems(prev => prev.map(i => i.card.id === cardId ? { ...i, notes } : i))
  }

  async function publish() {
    if (!userId || !tradeType || items.length === 0) return
    setStep('publishing')
    setError(null)

    const supabase = createClient()

    // Kartları upsert et
    for (const { card } of items) {
      await supabase.from('products').upsert({
        id: card.id,
        name: card.name,
        set_id: card.set.id,
        set_name: card.set.name,
        series: card.set.series,
        number: card.number,
        rarity: card.rarity,
        image_url: card.images.small,
        image_url_hires: card.images.large,
        types: card.types,
        supertype: card.supertype,
        subtypes: card.subtypes,
        hp: card.hp,
      }, { onConflict: 'id' })
    }

    // Her kart için ayrı takas ilanı oluştur
    const rows = items.map(({ card, condition, notes }) => ({
      user_id: userId,
      type: tradeType,
      product_id: card.id,
      custom_title: null,
      condition: tradeType === 'have' ? (condition ?? null) : null,
      notes: notes.trim() || null,
      photos: [],
    }))

    const { error: insertError } = await supabase.from('trades').insert(rows)

    if (insertError) {
      setError('Takas ilanı oluşturulamadı. Tekrar dene.')
      setStep('cards')
      return
    }

    router.push(`/takas?tab=${tradeType}`)
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

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Başlık */}
        <div className="mb-8">
          {step === 'cards' && (
            <button
              onClick={() => { setStep('type'); setItems([]); setResults([]); setSearched(false) }}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ChevronLeft className="h-4 w-4" /> Geri
            </button>
          )}
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">Takas İlanı Ver</h1>
          </div>
        </div>

        {/* Adım 1: Tür seçimi */}
        {step === 'type' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Ne yapmak istiyorsun?</h2>
            <p className="text-sm text-gray-500 mb-6">Elimdeki kartı vermek ya da aradığım kartı bulmak için ilan ver</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setTradeType('have'); setStep('cards') }}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-100 hover:border-primary/30 hover:bg-red-50/30 transition-all"
              >
                <span className="text-3xl">📦</span>
                <div className="text-center">
                  <p className="font-bold text-gray-900 text-sm">Elimde Mevcut</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">Takas için kart sunmak istiyorum</p>
                </div>
              </button>
              <button
                onClick={() => { setTradeType('want'); setStep('cards') }}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-100 hover:border-primary/30 hover:bg-red-50/30 transition-all"
              >
                <span className="text-3xl">🔍</span>
                <div className="text-center">
                  <p className="font-bold text-gray-900 text-sm">Arıyorum</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">Bu kartları arıyorum, takas beklerim</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Adım 2: Kart ekleme */}
        {step === 'cards' && (
          <div className="space-y-4">

            {/* Eklenen kartlar listesi */}
            {items.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                <div className="px-5 py-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">
                    {items.length} kart eklendi
                  </p>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    tradeType === 'have' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {tradeType === 'have' ? 'Elimde Mevcut' : 'Arıyorum'}
                  </span>
                </div>

                {items.map(({ card, condition, notes }) => (
                  <div key={card.id} className="p-4 space-y-3">
                    {/* Kart başlığı */}
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-9 flex-shrink-0">
                        <Image src={card.images.small} alt={card.name} fill sizes="40px" className="object-contain" unoptimized />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{card.name}</p>
                        <p className="text-xs text-gray-400">{card.set.name} · #{card.number}</p>
                      </div>
                      <button
                        onClick={() => removeItem(card.id)}
                        className="h-7 w-7 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Kondisyon — sadece "elimde mevcut" */}
                    {tradeType === 'have' && (
                      <div className="flex gap-1.5 flex-wrap">
                        {(Object.entries(CONDITIONS) as [Condition, typeof CONDITIONS[Condition]][]).map(([code]) => (
                          <button
                            key={code}
                            onClick={() => updateCondition(card.id, condition === code ? null : code)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all border ${
                              condition === code
                                ? `condition-${code.toLowerCase()} ring-1 ring-offset-1 ring-current border-transparent`
                                : `condition-${code.toLowerCase()} opacity-50 hover:opacity-100 border-transparent`
                            }`}
                          >
                            {code}
                          </button>
                        ))}
                        {condition && (
                          <button
                            onClick={() => updateCondition(card.id, null)}
                            className="px-2.5 py-1 rounded-full text-xs text-gray-400 hover:text-gray-600 border border-gray-200"
                          >
                            Temizle
                          </button>
                        )}
                      </div>
                    )}

                    {/* Notlar */}
                    <Textarea
                      value={notes}
                      onChange={e => updateNotes(card.id, e.target.value)}
                      placeholder={tradeType === 'have' ? 'Bu kart hakkında not...' : 'Hangi koşullarda kabul ederim...'}
                      rows={2}
                      className="text-xs"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Kart arama kutusu */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                {items.length === 0 ? 'Kart Ekle' : 'Başka Kart Ekle'}
              </p>

              {/* Set filtresi */}
              <div className="relative mb-3">
                <select
                  value={selectedSetId}
                  onChange={e => setSelectedSetId(e.target.value)}
                  disabled={loadingSets}
                  className="w-full h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 pr-10 text-sm text-gray-700 focus:outline-none focus:border-primary appearance-none disabled:opacity-50"
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

              {/* Arama */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && search()}
                    placeholder="Charizard, Pikachu, 125/197..."
                    className="pl-10 h-10"
                  />
                </div>
                <button
                  onClick={search}
                  disabled={searching || !query.trim()}
                  className="px-4 h-10 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ara'}
                </button>
              </div>

              {/* Arama sonuçları */}
              {searched && !searching && (
                results.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-4">Sonuç bulunamadı.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto">
                    {results.map(card => {
                      const alreadyAdded = items.some(i => i.card.id === card.id)
                      return (
                        <button
                          key={card.id}
                          onClick={() => !alreadyAdded && addCard(card)}
                          disabled={alreadyAdded}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all ${
                            alreadyAdded
                              ? 'border-green-200 bg-green-50 opacity-60 cursor-default'
                              : 'border-gray-100 hover:border-primary/40 hover:bg-red-50/20 cursor-pointer'
                          }`}
                        >
                          <div className="relative h-16 w-11">
                            <Image src={card.images.small} alt={card.name} fill sizes="48px" className="object-contain" unoptimized />
                          </div>
                          <p className="text-[11px] font-semibold text-gray-900 line-clamp-1 w-full">{card.name}</p>
                          <p className="text-[10px] text-gray-400 truncate w-full">{card.set.name}</p>
                          {alreadyAdded && (
                            <span className="text-[10px] text-green-600 font-medium">Eklendi</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              )}

              {!searched && (
                <div className="text-center py-6 text-gray-300">
                  <Search className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-xs">Kart adı veya numarası gir ve ara</p>
                </div>
              )}
            </div>

            {/* Yayınla butonu */}
            {items.length > 0 && (
              <button
                onClick={publish}
                className="w-full h-12 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                {items.length === 1 ? '1 kart ilanını yayınla' : `${items.length} kart ilanını yayınla`}
              </button>
            )}

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
            )}
          </div>
        )}

        {/* Yayınlanıyor */}
        {step === 'publishing' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center py-16">
            <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <div className="h-7 w-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="font-semibold text-gray-900">İlanlar yayınlanıyor...</p>
            <p className="text-sm text-gray-400 mt-1">{items.length} kart</p>
          </div>
        )}
      </div>
    </div>
  )
}
