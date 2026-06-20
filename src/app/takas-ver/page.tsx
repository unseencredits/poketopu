'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Check, ArrowRightLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import ProductSearchStep from '@/components/listing/ProductSearchStep'
import { CONDITIONS, type Condition } from '@/types'
import type { TCGCard } from '@/lib/pokemon-tcg'

type TradeType = 'have' | 'want'
type Step = 'type' | 'card' | 'details' | 'publishing'

interface TradeData {
  type?: TradeType
  productId?: string
  card?: TCGCard
  customTitle?: string
  condition?: Condition
  notes?: string
}

export default function TakasVerPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('type')
  const [userId, setUserId] = useState<string | null>(null)
  const [data, setData] = useState<TradeData>({})
  const [error, setError] = useState<string | null>(null)

  // details step state
  const [condition, setCondition] = useState<Condition | null>(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/giris?redirect=/takas-ver'); return }
      setUserId(user.id)
    }
    init()
  }, [router])

  async function publish() {
    if (!userId || !data.type) return
    setStep('publishing')
    setError(null)

    const supabase = createClient()

    // Pokemon kartını upsert et
    if (data.card) {
      await supabase.from('products').upsert({
        id: data.card.id,
        name: data.card.name,
        set_id: data.card.set.id,
        set_name: data.card.set.name,
        series: data.card.set.series,
        number: data.card.number,
        rarity: data.card.rarity,
        image_url: data.card.images.small,
        image_url_hires: data.card.images.large,
        types: data.card.types,
        supertype: data.card.supertype,
        subtypes: data.card.subtypes,
        hp: data.card.hp,
      }, { onConflict: 'id' })
    }

    const { error: tradeError } = await supabase
      .from('trades')
      .insert({
        user_id: userId,
        type: data.type,
        product_id: data.productId ?? null,
        custom_title: data.customTitle ?? null,
        condition: data.type === 'have' ? (condition ?? null) : null,
        notes: notes.trim() || null,
        photos: [],
      })

    if (tradeError) {
      setError('Takas ilanı oluşturulamadı. Tekrar dene.')
      setStep('details')
      return
    }

    router.push('/takas?yeni=1')
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4">
      <div className="max-w-lg mx-auto">

        {/* Başlık */}
        <div className="mb-8">
          {step !== 'type' && step !== 'publishing' && (
            <button
              onClick={() => {
                if (step === 'card') setStep('type')
                else if (step === 'details') setStep('card')
              }}
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

        <div className="bg-white rounded-2xl border border-gray-100 p-6">

          {/* Adım 1: Tür seçimi */}
          {step === 'type' && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Ne yapmak istiyorsun?</h2>
              <p className="text-sm text-gray-500 mb-6">Elimdeki kartı vermek ya da aradığım kartı bulmak için ilan ver</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setData(d => ({ ...d, type: 'have' })); setStep('card') }}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-100 hover:border-primary/30 hover:bg-red-50/30 transition-all text-left"
                >
                  <span className="text-3xl">📦</span>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Elimde Mevcut</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-snug">Elimdeki kartı takas için sunmak istiyorum</p>
                  </div>
                </button>
                <button
                  onClick={() => { setData(d => ({ ...d, type: 'want' })); setStep('card') }}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-100 hover:border-primary/30 hover:bg-red-50/30 transition-all text-left"
                >
                  <span className="text-3xl">🔍</span>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Arıyorum</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-snug">Bu kartı arıyorum, takas teklifi bekliyorum</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Adım 2: Kart seçimi */}
          {step === 'card' && (
            <ProductSearchStep
              category="card"
              onSelect={product => {
                setData(d => ({ ...d, ...product }))
                setStep('details')
              }}
            />
          )}

          {/* Adım 3: Detaylar */}
          {step === 'details' && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Detaylar</h2>
              <p className="text-sm text-gray-500 mb-6">
                {data.type === 'have'
                  ? 'Kartın durumunu ve notlarını ekle'
                  : 'Hangi koşullarda kabul edersin, ne teklif ediyorsun?'}
              </p>

              {/* Seçilen kart özeti */}
              {data.card && (
                <div className="mb-5 p-3 rounded-xl bg-gray-50 flex items-center gap-3">
                  <div className="relative h-10 w-7 flex-shrink-0">
                    <img src={data.card.images.small} alt={data.card.name} className="object-contain h-full w-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{data.card.name}</p>
                    <p className="text-xs text-gray-400">{data.card.set.name} · #{data.card.number}</p>
                  </div>
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 ml-auto" />
                </div>
              )}

              <div className="space-y-5">
                {/* Kondisyon — sadece "elimde mevcut" için */}
                {data.type === 'have' && (
                  <div className="space-y-2">
                    <Label>Kart Koşulu <span className="text-gray-400 font-normal text-xs">(isteğe bağlı)</span></Label>
                    <div className="grid grid-cols-5 gap-2">
                      {(Object.entries(CONDITIONS) as [Condition, typeof CONDITIONS[Condition]][]).map(([code, info]) => (
                        <button
                          key={code}
                          onClick={() => setCondition(condition === code ? null : code)}
                          className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border text-center transition-all ${
                            condition === code
                              ? 'border-primary bg-red-50 ring-2 ring-primary/20'
                              : 'border-gray-100 bg-white hover:border-gray-200'
                          }`}
                        >
                          <span className={`text-base font-bold condition-${code.toLowerCase()} px-2 py-0.5 rounded-full text-xs`}>
                            {code}
                          </span>
                          <span className="text-[10px] tracking-[-1.5px] text-gray-400">
                            {'★'.repeat(info.stars)}{'☆'.repeat(5 - info.stars)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notlar */}
                <div className="space-y-1.5">
                  <Label>
                    {data.type === 'have' ? 'Notlar' : 'Takas Teklifin / Notlar'}
                    <span className="text-gray-400 font-normal text-xs ml-1">(isteğe bağlı)</span>
                  </Label>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder={
                      data.type === 'have'
                        ? 'Kartın durumu, takas önerilerin, extra bilgiler...'
                        : 'Hangi kartlarla takas teklifi yaparım, hangi koşulda isterim...'
                    }
                    rows={4}
                  />
                </div>

                <button
                  onClick={publish}
                  disabled={!data.productId && !data.customTitle}
                  className="w-full h-11 bg-primary text-white rounded-xl font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  Takas İlanını Yayınla
                </button>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}
              </div>
            </div>
          )}

          {/* Yayınlanıyor */}
          {step === 'publishing' && (
            <div className="text-center py-12">
              <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <div className="h-7 w-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="font-semibold text-gray-900">İlan yayınlanıyor...</p>
            </div>
          )}
        </div>

        {/* Alt bilgi */}
        {step === 'details' && data.type && (
          <div className="mt-4 p-4 rounded-2xl bg-white border border-gray-100 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
            <p className="text-xs text-gray-500">
              {data.type === 'have' ? '📦 Elimde Mevcut' : '🔍 Arıyorum'} ·{' '}
              {data.card?.name ?? data.customTitle ?? '—'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
