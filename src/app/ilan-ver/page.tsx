'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import CategoryStep from '@/components/listing/CategoryStep'
import ProductSearchStep from '@/components/listing/ProductSearchStep'
import DetailsStep from '@/components/listing/DetailsStep'
import PhotoUploadStep from '@/components/listing/PhotoUploadStep'
import type { Category, Condition } from '@/types'
import type { TCGCard } from '@/lib/pokemon-tcg'
import { checkModeration } from '@/app/actions/moderation'

type Step = 'category' | 'product' | 'details' | 'photos' | 'publishing'

const STEP_LABELS: Record<Exclude<Step, 'publishing'>, string> = {
  category: 'Kategori',
  product:  'Ürün',
  details:  'Detaylar',
  photos:   'Fotoğraf',
}
const STEP_ORDER: Exclude<Step, 'publishing'>[] = ['category', 'product', 'details', 'photos']

interface ListingData {
  category?: Category
  productId?: string
  card?: TCGCard
  customTitle?: string
  customDescription?: string
  condition?: Condition
  grader?: string
  grade?: number
  price?: number
  quantity?: number
  notes?: string
  city?: string
  shipping?: 'kargo' | 'elden' | 'her_ikisi'
  swapOpen?: boolean
  photos?: string[]
}

export default function IlanVerPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('category')
  const [userId, setUserId] = useState<string | null>(null)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [data, setData] = useState<ListingData>({})
  const [error, setError] = useState<string | null>(null)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [checkingModeration, setCheckingModeration] = useState(false)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/giris?redirect=/ilan-ver'); return }
      setUserId(user.id)

      // Mağaza kontrolü
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (store) {
        setStoreId(store.id)
      } else {
        // Kullanıcı adıyla otomatik mağaza oluştur
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()

        if (profile) {
          const { data: newStore } = await supabase
            .from('stores')
            .insert({ user_id: user.id, name: profile.username, slug: profile.username })
            .select('id')
            .single()
          if (newStore) setStoreId(newStore.id)
        }
      }
    }
    init()
  }, [router])

  async function publish(photoUrls: string[]) {
    if (!storeId) return
    setStep('publishing')
    setError(null)

    // Fotoğraf moderasyonu (metin, detaylar adımında zaten kontrol edildi)
    if (photoUrls.length > 0) {
      const { flagged, reason } = await checkModeration([], photoUrls)
      if (flagged) {
        setError(`Fotoğraf uygunsuz bulundu (${reason ?? 'uygunsuz içerik'}). Lütfen kaldırıp tekrar dene.`)
        setStep('photos')
        return
      }
    }

    const supabase = createClient()

    // Pokemon kartını ürün tablosuna kaydet (upsert)
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

    // İlanı oluştur
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert({
        seller_id: storeId,
        product_id: data.productId ?? null,
        custom_title: data.customTitle ?? null,
        custom_description: data.customDescription ?? null,
        category: data.category!,
        condition: data.condition ?? null,
        condition_stars: data.condition ? { NM: 5, LP: 4, MP: 3, HP: 2, D: 1 }[data.condition] : null,
        price: data.price!,
        quantity: data.quantity ?? 1,
        notes: data.notes ?? null,
        grader: data.grader ?? null,
        grade: data.grade ?? null,
        city: data.city || null,
        shipping: data.shipping ?? 'her_ikisi',
        swap_open: data.swapOpen ?? false,
        photos: photoUrls,
      })
      .select('id')
      .single()

    if (listingError || !listing) {
      setError('İlan oluşturulamadı. Tekrar dene.')
      setStep('photos')
      return
    }

    router.push(`/ilan/${listing.id}?yeni=1`)
  }

  const currentStepIdx = STEP_ORDER.indexOf(step as Exclude<Step, 'publishing'>)

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4">
      <div className="max-w-lg mx-auto">

        {/* Başlık & adım göstergesi */}
        <div className="mb-8">
          {step !== 'category' && step !== 'publishing' && (
            <button
              onClick={() => {
                const prev = STEP_ORDER[currentStepIdx - 1]
                if (prev) setStep(prev)
              }}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ChevronLeft className="h-4 w-4" /> Geri
            </button>
          )}

          <h1 className="text-2xl font-bold text-gray-900">İlan Ver</h1>

          {/* Adım göstergesi */}
          {step !== 'publishing' && (
            <div className="flex items-center mt-4">
              {STEP_ORDER.flatMap((s, idx) => {
                const isCompleted = idx < currentStepIdx
                const isCurrent = idx === currentStepIdx
                const isClickable = isCompleted && !checkingModeration
                const items = []
                if (idx > 0) {
                  items.push(
                    <div key={`line-${idx}`} className={`h-px flex-1 ${idx <= currentStepIdx ? 'bg-primary' : 'bg-gray-200'}`} />
                  )
                }
                items.push(
                  <button
                    key={s}
                    onClick={() => { if (isClickable) setStep(s) }}
                    disabled={!isClickable}
                    title={STEP_LABELS[s]}
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
                      isCurrent
                        ? 'bg-primary text-white cursor-default'
                        : isCompleted
                          ? 'bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer'
                          : 'bg-gray-100 text-gray-300 cursor-default'
                    }`}
                  >
                    {isCompleted ? <Check className="h-3 w-3" /> : idx + 1}
                  </button>
                )
                return items
              })}
            </div>
          )}
          {step !== 'publishing' && (
            <p className="text-xs text-gray-400 mt-2">
              Adım {currentStepIdx + 1} / {STEP_ORDER.length} — {STEP_LABELS[step as keyof typeof STEP_LABELS]}
            </p>
          )}
        </div>

        {/* Adım içeriği */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          {step === 'category' && (
            <CategoryStep
              onSelect={cat => {
                setData(d => ({ ...d, category: cat }))
                setStep('product')
              }}
            />
          )}

          {step === 'product' && data.category && (
            <ProductSearchStep
              category={data.category}
              onSelect={product => {
                setData(d => ({ ...d, ...product }))
                setStep('details')
              }}
            />
          )}

          {step === 'details' && data.category && (
            <div>
              <div className={checkingModeration ? 'pointer-events-none opacity-50' : ''}>
                <DetailsStep
                  category={data.category}
                  productId={data.card?.id}
                  onNext={async details => {
                    setData(d => ({ ...d, ...details }))
                    setDetailsError(null)
                    setCheckingModeration(true)
                    const texts = [data.customTitle ?? '', data.customDescription ?? '', details.notes ?? '']
                    const { flagged, reason } = await checkModeration(texts, [])
                    setCheckingModeration(false)
                    if (flagged) {
                      setDetailsError(`İçerik uygunsuz bulundu (${reason ?? 'uygunsuz içerik'}). Lütfen düzenleyip tekrar dene.`)
                    } else {
                      setDetailsError(null)
                      setStep('photos')
                    }
                  }}
                />
              </div>
              {checkingModeration && (
                <div className="flex items-center justify-center gap-2 mt-3 text-sm text-gray-500">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  İçerik kontrol ediliyor...
                </div>
              )}
              {detailsError && (
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mt-3">{detailsError}</p>
              )}
            </div>
          )}

          {step === 'photos' && userId && (
            <div>
              <PhotoUploadStep
                userId={userId}
                onNext={photoUrls => publish(photoUrls)}
              />
              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mt-3">{error}</p>
              )}
            </div>
          )}

          {step === 'publishing' && (
            <div className="text-center py-12">
              <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <div className="h-7 w-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="font-semibold text-gray-900">İlan yayınlanıyor...</p>
              <p className="text-sm text-gray-500 mt-1">Bir saniye</p>
            </div>
          )}
        </div>

        {/* İlan özeti (kategori ve sonrası) */}
        {step !== 'category' && step !== 'publishing' && (
          <div className="mt-4 p-4 rounded-2xl bg-white border border-gray-100 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                {{ card: 'Kart', sealed: 'Sealed', graded: 'Derecelendirilmiş', accessory: 'Aksesuar' }[data.category!] ?? data.category}
              </p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {data.card?.name ?? data.customTitle ?? '—'}
              </p>
            </div>
            {data.price && (
              <p className="ml-auto text-sm font-bold text-gray-900 flex-shrink-0">
                {data.price.toLocaleString('tr-TR')} ₺
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
