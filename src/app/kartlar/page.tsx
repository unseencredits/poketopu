import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { ChevronLeft, Sparkles } from 'lucide-react'
import { unstable_cache } from 'next/cache'
import { createClient as createSupabaseAnon } from '@supabase/supabase-js'
import { getSets } from '@/lib/pokemon-tcg'
import KartlarFiltre from './KartlarFiltre'
import MobileFilter from './MobileFilter'
import type { TCGSet } from '@/lib/pokemon-tcg'

interface Props {
  searchParams: Promise<Record<string, string>>
}

interface ProductCard {
  id: string
  name: string
  set_name: string | null
  number: string | null
  image_url: string | null
  count: number
  minPrice: number
  conditions: string[]
  isFeatured: boolean
}

interface Filters {
  kondisyon?: string
  sirala?: string
  min?: string
  max?: string
}

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

// 5 dakika sunucu cache'i — cookie bağımsız anon client kullanır
const getSetListingCounts = unstable_cache(
  async (): Promise<Record<string, number>> => {
    const supabase = createSupabaseAnon(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data } = await supabase
      .from('listings')
      .select('product:products!inner(set_id)')
      .eq('status', 'active')
      .eq('category', 'card')
      .not('product_id', 'is', null)
      .limit(5000)

    const counts: Record<string, number> = {}
    for (const l of data ?? []) {
      const setId = (l.product as unknown as { set_id: string | null })?.set_id
      if (setId) counts[setId] = (counts[setId] ?? 0) + 1
    }
    return counts
  },
  ['set-listing-counts'],
  { revalidate: 300, tags: ['kartlar-listing'] },
)

// Set kartları 2 dk cache'lenir; condition verisi de saklanır
const getProductsInSetCached = unstable_cache(
  async (setId: string): Promise<ProductCard[]> => {
    const supabase = createSupabaseAnon(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data: prods } = await supabase
      .from('products').select('id').eq('set_id', setId)
    const productIds = (prods ?? []).map((p: { id: string }) => p.id)
    if (!productIds.length) return []

    const { data } = await supabase
      .from('listings')
      .select('product_id, price, condition, featured_until, product:products(id,name,set_name,number,image_url)')
      .eq('status', 'active')
      .eq('category', 'card')
      .in('product_id', productIds)
      .limit(2000)

    const map = new Map<string, ProductCard>()
    for (const l of data ?? []) {
      if (!l.product_id || !l.product) continue
      const p = l.product as unknown as {
        id: string; name: string; set_name: string | null
        number: string | null; image_url: string | null
      }
      const isFeatured = !!(l.featured_until && new Date(l.featured_until) > new Date())
      const existing = map.get(l.product_id)
      if (existing) {
        existing.count++
        if (l.price < existing.minPrice) existing.minPrice = l.price
        if (l.condition && !existing.conditions.includes(l.condition)) {
          existing.conditions.push(l.condition)
        }
        if (isFeatured) existing.isFeatured = true
      } else {
        map.set(l.product_id, {
          id: p.id, name: p.name, set_name: p.set_name,
          number: p.number, image_url: p.image_url,
          count: 1, minPrice: l.price,
          conditions: l.condition ? [l.condition] : [],
          isFeatured,
        })
      }
    }
    return Array.from(map.values())
  },
  ['set-products'],
  { revalidate: 120, tags: ['kartlar-listing'] },
)

async function getProductsInSet(
  setId: string,
  filters: Filters = {},
): Promise<{ products: ProductCard[]; total: number }> {
  let products = await getProductsInSetCached(setId)

  if (filters.kondisyon) products = products.filter(p => p.conditions.includes(filters.kondisyon!))
  if (filters.min) products = products.filter(p => p.minPrice >= Number(filters.min))
  if (filters.max) products = products.filter(p => p.minPrice <= Number(filters.max))

  if (filters.sirala === 'fiyat-asc')       products = [...products].sort((a, b) => a.minPrice - b.minPrice)
  else if (filters.sirala === 'fiyat-desc') products = [...products].sort((a, b) => b.minPrice - a.minPrice)
  else                                       products = [...products].sort((a, b) => b.count - a.count)

  return { products, total: products.length }
}

// ─── Setler görünümü ────────────────────────────────────────────────────────

async function SetsView({ selectedSeri }: { selectedSeri: string | null }) {
  const [allSets, counts] = await Promise.all([getSets(), getSetListingCounts()])

  const setsBySeries: Record<string, (TCGSet & { listingCount: number })[]> = {}
  for (const set of allSets) {
    const count = counts[set.id] ?? 0
    if (count === 0) continue
    const series = set.series || 'Diğer'
    if (!setsBySeries[series]) setsBySeries[series] = []
    setsBySeries[series].push({ ...set, listingCount: count })
  }

  const allOrderedSeries = [
    ...SERIES_ORDER.filter(s => setsBySeries[s]),
    ...(setsBySeries['Diğer'] ? ['Diğer'] : []),
  ]

  const displayedSeries = selectedSeri
    ? allOrderedSeries.filter(s => s === selectedSeri)
    : allOrderedSeries

  const totalListings = Object.values(counts).reduce((a, b) => a + b, 0)

  const setsBySeriesForMobile: Record<string, TCGSet[]> = {}
  for (const [series, sets] of Object.entries(setsBySeries)) {
    setsBySeriesForMobile[series] = sets
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kartlar</h1>
            <p className="text-sm text-gray-500 mt-1">
              {allOrderedSeries.length} seri · {totalListings.toLocaleString('tr-TR')} aktif ilan
            </p>
          </div>
          {/* Mobil: seri & set seçimi */}
          <div className="sm:hidden">
            <MobileFilter
              setsBySeries={setsBySeriesForMobile}
              selectedSeri={selectedSeri}
              selectedSetId={null}
              selectedSetName={null}
            />
          </div>
        </div>

        {/* Masaüstü: yatay kaydırılabilir seri chip'leri */}
        <div className="hidden sm:flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Link
            href="/kartlar"
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              !selectedSeri
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tümü
          </Link>
          {allOrderedSeries.map(series => (
            <Link
              key={series}
              href={`/kartlar?seri=${encodeURIComponent(series)}`}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                selectedSeri === series
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {series}
            </Link>
          ))}
        </div>
      </div>

      {displayedSeries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-400 mb-3">Henüz kart ilanı yok.</p>
          <Link href="/ilan-ver" className="text-sm text-primary hover:underline">
            İlk ilanı sen ver →
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {displayedSeries.map(series => (
            <div key={series}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                {series}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {setsBySeries[series].map(set => (
                  <Link
                    key={set.id}
                    href={`/kartlar?set_id=${set.id}`}
                    className="group flex flex-col items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white hover:border-primary/30 hover:bg-red-50/20 hover:shadow-sm transition-all text-center"
                  >
                    <div className="relative h-10 w-full flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={set.images.logo}
                        alt={set.name}
                        className="h-10 w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800 group-hover:text-primary transition-colors leading-snug line-clamp-2">
                        {set.name}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {set.listingCount} ilan
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Set kartları görünümü ───────────────────────────────────────────────────

async function SetCardsView({
  setId,
  filters,
}: {
  setId: string
  filters: Filters
}) {
  const [allSets, { products, total }] = await Promise.all([
    getSets(),
    getProductsInSet(setId, filters),
  ])

  const selectedSet = allSets.find(s => s.id === setId)
  const activeFilterCount = [filters.kondisyon, filters.sirala, filters.min, filters.max].filter(Boolean).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Geri */}
      <Link
        href="/kartlar"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Tüm Setler
      </Link>

      {/* Set başlığı */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4 min-w-0">
          {selectedSet?.images?.logo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={selectedSet.images.logo}
              alt={selectedSet.name}
              className="h-10 flex-shrink-0 object-contain"
            />
          )}
          <div className="min-w-0">
            {selectedSet?.series && (
              <p className="text-xs text-gray-400 mb-0.5">{selectedSet.series}</p>
            )}
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {selectedSet?.name ?? setId}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {total} farklı kart
              {activeFilterCount > 0 && (
                <span className="ml-1 text-primary">· {activeFilterCount} filtre aktif</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0">
          <Suspense>
            <KartlarFiltre />
          </Suspense>
        </div>
      </div>

      {/* Kartlar */}
      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-400 mb-3">
            {selectedSet ? `${selectedSet.name} setinde ilan bulunamadı.` : 'İlan bulunamadı.'}
          </p>
          <Link href="/ilan-ver" className="text-sm text-primary hover:underline">
            İlk ilanı sen ver →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(p => (
            <Link key={p.id} href={`/kart/${p.id}`} className="group block">
              <div className={`rounded-2xl border bg-white overflow-hidden transition-all ${
                p.isFeatured
                  ? 'border-primary/50 shadow-sm shadow-primary/10 hover:border-primary/70'
                  : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
              }`}>
                <div
                  className="relative bg-gray-50 flex items-center justify-center"
                  style={{ aspectRatio: '5/7' }}
                >
                  {p.image_url ? (
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      className="object-contain p-3"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      unoptimized
                    />
                  ) : (
                    <div className="w-16 h-22 rounded-lg bg-gray-200" />
                  )}
                  {p.isFeatured && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-white uppercase tracking-wide">
                        <Sparkles className="h-2.5 w-2.5" />
                        Öne Çıkan
                      </span>
                    </div>
                  )}
                  {p.count > 1 && (
                    <span className="absolute top-2 right-2 bg-primary/80 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {p.count} ilan
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                    {p.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {p.set_name}{p.number ? ` · #${p.number}` : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-1.5 font-medium">
                    {p.count === 1 ? '1 ilan' : `${p.count} ilan`}
                    {' · '}
                    <span className="text-gray-700">{p.minPrice.toLocaleString('tr-TR')} ₺'den</span>
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Ana page bileşeni ───────────────────────────────────────────────────────

export default async function KartlarPage({ searchParams }: Props) {
  const sp = await searchParams
  const selectedSetId = sp.set_id ?? null

  if (selectedSetId) {
    return (
      <SetCardsView
        setId={selectedSetId}
        filters={{
          kondisyon: sp.kondisyon,
          sirala:    sp.sirala,
          min:       sp.min,
          max:       sp.max,
        }}
      />
    )
  }

  return <SetsView selectedSeri={sp.seri ?? null} />
}
