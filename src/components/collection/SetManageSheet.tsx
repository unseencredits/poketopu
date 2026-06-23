'use client'

import { useState, useEffect, useMemo } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, ChevronLeft, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { TCGSet, TCGCard } from '@/lib/pokemon-tcg'

export interface CollectionItem {
  id: string
  quantity: number
  condition: string | null
  created_at: string
  product: {
    id: string
    name: string
    set_name: string | null
    set_id: string | null
    image_url: string | null
    number: string | null
  } | null
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  preselectedSetId: string | null
  preselectedSetName: string | null
  existingItems: CollectionItem[]
  onSave: (updatedItems: CollectionItem[]) => void
}

export default function SetManageSheet({
  open, onOpenChange, userId,
  preselectedSetId, preselectedSetName,
  existingItems, onSave,
}: Props) {
  const [step, setStep] = useState<'set-picker' | 'cards'>('set-picker')
  const [sets, setSets] = useState<TCGSet[]>([])
  const [setsLoading, setSetsLoading] = useState(false)
  const [setSearch, setSetSearch] = useState('')
  const [selectedSet, setSelectedSet] = useState<{ id: string; name: string } | null>(null)

  const [cards, setCards] = useState<TCGCard[]>([])
  const [cardsLoading, setCardsLoading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [cardSearch, setCardSearch] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setCardSearch('')

    const existingIds = new Set(existingItems.map(i => i.product?.id).filter(Boolean) as string[])
    setSelected(existingIds)

    if (preselectedSetId && preselectedSetName) {
      setSelectedSet({ id: preselectedSetId, name: preselectedSetName })
      setStep('cards')
    } else {
      setStep('set-picker')
      setSelectedSet(null)
      setSetSearch('')
      setSetsLoading(true)
      fetch('/api/tcg/sets')
        .then(r => r.json())
        .then(data => { setSets(data); setSetsLoading(false) })
        .catch(() => setSetsLoading(false))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (step !== 'cards' || !selectedSet) return
    setCardsLoading(true)
    setCards([])
    fetch(`/api/tcg/cards?set_id=${selectedSet.id}`)
      .then(r => r.json())
      .then(json => { setCards(json.data ?? []); setCardsLoading(false) })
      .catch(() => setCardsLoading(false))
  }, [step, selectedSet])

  const filteredSets = useMemo(() => {
    if (!setSearch.trim()) return sets
    const q = setSearch.toLowerCase()
    return sets.filter(s =>
      s.name.toLowerCase().includes(q) || s.series.toLowerCase().includes(q)
    )
  }, [sets, setSearch])

  const filteredCards = useMemo(() => {
    if (!cardSearch.trim()) return cards
    const q = cardSearch.toLowerCase()
    return cards.filter(c =>
      c.name.toLowerCase().includes(q) || c.number.toLowerCase().includes(q)
    )
  }, [cards, cardSearch])

  function toggleCard(cardId: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }

  async function handleSave() {
    if (!selectedSet) return
    setSaving(true)
    const supabase = createClient()

    const existingProductIds = new Set(
      existingItems.map(i => i.product?.id).filter(Boolean) as string[]
    )
    const toAdd = cards.filter(c => selected.has(c.id) && !existingProductIds.has(c.id))
    const toRemove = existingItems.filter(i => i.product?.id && !selected.has(i.product.id))

    // Yeni seçilen kartları products tablosuna upsert et
    if (toAdd.length > 0) {
      await supabase.from('products').upsert(
        toAdd.map(c => ({
          id: c.id,
          name: c.name,
          set_id: c.set.id,
          set_name: c.set.name,
          series: c.set.series,
          number: c.number,
          rarity: c.rarity,
          image_url: c.images.small,
          image_url_hires: c.images.large,
          types: c.types,
          supertype: c.supertype,
          subtypes: c.subtypes,
          hp: c.hp,
        })),
        { onConflict: 'id' }
      )
    }

    // Yeni koleksiyon kayıtları ekle
    let newItems: CollectionItem[] = existingItems.filter(
      i => i.product?.id && selected.has(i.product.id)
    )

    if (toAdd.length > 0) {
      const { data: inserted } = await supabase
        .from('collections')
        .insert(toAdd.map(c => ({ user_id: userId, product_id: c.id, quantity: 1 })))
        .select('id, quantity, condition, created_at, product:products(id,name,set_name,set_id,image_url,number)')

      if (inserted) {
        newItems = [...newItems, ...(inserted as unknown as CollectionItem[])]
      }
    }

    // Seçimi kaldırılan kartları sil
    if (toRemove.length > 0) {
      await supabase.from('collections').delete().in('id', toRemove.map(i => i.id))
    }

    onSave(newItems)
    setSaving(false)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col overflow-hidden">
        {/* Başlık */}
        <div className="flex items-center gap-3 p-5 border-b border-gray-100 flex-shrink-0">
          {step === 'cards' && !preselectedSetId && (
            <button
              onClick={() => setStep('set-picker')}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">
              {step === 'set-picker' ? 'Set Seç' : selectedSet?.name}
            </p>
            {step === 'cards' && (
              <p className="text-xs text-gray-400 mt-0.5">{selected.size} kart seçildi</p>
            )}
          </div>
          {step === 'cards' && (
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="bg-primary text-white rounded-xl text-xs h-8 px-4"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          )}
        </div>

        {/* Set seçici */}
        {step === 'set-picker' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-4 pt-4 pb-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={setSearch}
                  onChange={e => setSetSearch(e.target.value)}
                  placeholder="Set ara..."
                  className="pl-9 h-10"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {setsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-0.5 mt-2">
                  {filteredSets.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedSet({ id: s.id, name: s.name })
                        setStep('cards')
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="h-8 w-14 flex-shrink-0 flex items-center justify-center">
                        {s.images.logo ? (
                          <img src={s.images.logo} alt={s.name} className="h-8 w-14 object-contain" />
                        ) : (
                          <div className="h-8 w-14 rounded bg-gray-100" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.series} · {s.total} kart</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Kart seçici */}
        {step === 'cards' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-4 pt-4 pb-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={cardSearch}
                  onChange={e => setCardSearch(e.target.value)}
                  placeholder="Kart ara..."
                  className="pl-9 h-10"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {cardsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {filteredCards.map(card => {
                    const isSelected = selected.has(card.id)
                    return (
                      <button
                        key={card.id}
                        onClick={() => toggleCard(card.id)}
                        className={`relative rounded-xl border-2 overflow-hidden transition-all ${
                          isSelected
                            ? 'border-primary shadow-sm shadow-primary/20'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                        style={{ aspectRatio: '5/7' }}
                      >
                        <div className="w-full h-full bg-gray-50">
                          {card.images.small ? (
                            <img
                              src={card.images.small}
                              alt={card.name}
                              className="w-full h-full object-contain p-0.5"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-8 h-12 rounded bg-gray-200" />
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/15 flex items-start justify-end p-1">
                            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent px-1 pb-0.5">
                          <span className="text-[9px] font-semibold text-white">{card.number}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
