import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getSets } from '@/lib/pokemon-tcg'
import MobileFilter from './MobileFilter'
import KartlarFiltre from './KartlarFiltre'
import type { TCGSet } from '@/lib/pokemon-tcg'
import type { Condition } from '@/types'

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

interface Filters {
  kondisyon?: string
  sirala?: string
  min?: string
  max?: string
}

async function getProducts(seri: string | null, setId: string | null, filters: Filters = {}): Promise<{ products: ProductCard[]; total: number }> {
  const supabase = await createClient()

  let productIds: string[] | null = null

  if (setId) {
    const { data: prods } = await supabase.from('products').select('id').eq('set_id', setId)
    productIds = (prods ?? []).map((p: { id: string }) => p.id)
    if (!productIds.length) return { products: [], total: 0 }
  } else if (seri) {
    const { data: prods } = await supabase.from('products').select('id').eq('series', seri)
    productIds = (prods ?? []).map((p: { id: string }) => p.id)
    if (!productIds.length) return { products: [], total: 0 }
  }

  let query = supabase
    .from('listings')
    .select('product_id, price, product:products(id,name,set_name,number,image_url)')
    .eq('status', 'active')
    .eq('category', 'card')
    .not('product_id', 'is', null)

  if (productIds) query = query.in('product_id', productIds)
  if (filters.kondisyon) query = query.eq('condition', filters.kondisyon as Condition)
  if (filters.min) query = query.gte('price', Number(filters.min))
  if (filters.max) query = query.lte('price', Number(filters.max))

  const { data } = await query

  const map = new Map<string, ProductCard & { minPrice: number }>()
  for (const l of data ?? []) {
    if (!l.product_id || !l.product) continue
    const p = l.product as unknown as { id: string; name: string; set_name: string | null; number: string | null; image_url: string | null }
    const existing = map.get(l.product_id)
    if (existing) {
      existing.count++
      if (l.price < existing.minPrice) existing.minPrice = l.price
    } else {
      map.set(l.product_id, { id: p.id, name: p.name, set_name: p.set_name, number: p.number, image_url: p.image_url, count: 1, minPrice: l.price })
    }
  }

  let products = Array.from(map.values())

  if (filters.sirala === 'fiyat-asc') products.sort((a, b) => a.minPrice - b.minPrice)
  else if (filters.sirala === 'fiyat-desc') products.sort((a, b) => b.minPrice - a.minPrice)
  else products.sort((a, b) => b.count - a.count)

  return { products, total: products.length }
}

export default async function KartlarPage({ searchParams }: Props) {
  const sp = await searchParams
  const selectedSeri = sp.seri ?? null
  const selectedSetId = sp.set_id ?? null

  // Setleri TCG API'den çek, seriye göre grupla
  const allSets = await getSets()
  const setsBySeries: Record<string, TCGSet[]> = {}
  for (const set of allSets) {
    const series = set.series || 'Diğer'
    if (!setsBySeries[series]) setsBySeries[series] = []
    setsBySeries[series].push(set)
  }

  // Seçilen serinin setleri (sidebar için)
  const setsInSelectedSeries = selectedSeri ? (setsBySeries[selectedSeri] ?? []) : []

  // Seçilen set'in adını bul
  const selectedSet = selectedSetId ? allSets.find(s => s.id === selectedSetId) : null

  const filters: Filters = {
    kondisyon: sp.kondisyon,
    sirala: sp.sirala,
    min: sp.min,
    max: sp.max,
  }
  const { products, total } = await getProducts(selectedSeri, selectedSetId, filters)
  const activeFilterCount = [sp.kondisyon, sp.sirala, sp.min, sp.max].filter(Boolean).length

  // Sayfa başlığı
  const pageTitle = selectedSet
    ? selectedSet.name
    : selectedSeri
      ? selectedSeri
      : 'Tüm Kartlar'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex gap-8">

        {/* Sol: Seri + Set filtresi */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-24 space-y-6">

            {/* Seriler */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Seri</p>
              <div className="space-y-0.5">
                <Link
                  href="/kartlar"
                  className={`block text-sm px-3 py-2 rounded-lg transition-colors ${
                    !selectedSeri && !selectedSetId
                      ? 'bg-red-50 text-primary font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Tümü
                </Link>
                {SERIES_ORDER.filter(s => setsBySeries[s]).map(seri => (
                  <Link
                    key={seri}
                    href={`/kartlar?seri=${encodeURIComponent(seri)}`}
                    className={`block text-sm px-3 py-2 rounded-lg transition-colors ${
                      selectedSeri === seri
                        ? 'bg-red-50 text-primary font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {seri}
                  </Link>
                ))}
              </div>
            </div>

            {/* Setler — sadece seri seçiliyken */}
            {selectedSeri && setsInSelectedSeries.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Set</p>
                <div className="space-y-0.5">
                  <Link
                    href={`/kartlar?seri=${encodeURIComponent(selectedSeri)}`}
                    className={`block text-sm px-3 py-2 rounded-lg transition-colors ${
                      !selectedSetId
                        ? 'bg-red-50 text-primary font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Tüm {selectedSeri}
                  </Link>
                  {setsInSelectedSeries.map(set => (
                    <Link
                      key={set.id}
                      href={`/kartlar?seri=${encodeURIComponent(selectedSeri)}&set_id=${set.id}`}
                      className={`block text-sm px-3 py-2 rounded-lg transition-colors leading-snug ${
                        selectedSetId === set.id
                          ? 'bg-red-50 text-primary font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {set.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Sağ: İlanlar */}
        <div className="flex-1 min-w-0">
          {/* Başlık satırı */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              {selectedSeri && !selectedSetId && (
                <p className="text-xs text-gray-400 mb-1">{selectedSeri}</p>
              )}
              {selectedSet && (
                <p className="text-xs text-gray-400 mb-1">{selectedSeri} · {selectedSet.name}</p>
              )}
              <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {total.toLocaleString('tr-TR')} farklı kart
                {activeFilterCount > 0 && <span className="ml-1 text-primary">· {activeFilterCount} filtre aktif</span>}
              </p>
            </div>

            {/* Filtre butonları */}
            <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
              {/* Mobil: set filtresi */}
              <div className="lg:hidden">
                <MobileFilter
                  setsBySeries={setsBySeries}
                  selectedSeri={selectedSeri}
                  selectedSetId={selectedSetId}
                  selectedSetName={selectedSet?.name ?? null}
                />
              </div>
              {/* Sıralama + kondisyon + fiyat filtresi */}
              <Suspense>
                <KartlarFiltre />
              </Suspense>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <p className="text-sm text-gray-400 mb-3">
                {selectedSet
                  ? `${selectedSet.name} setinde henüz ilan yok.`
                  : selectedSeri
                    ? `${selectedSeri} serisinde henüz ilan yok.`
                    : 'Henüz kart ilanı yok.'}
              </p>
              <Link href="/ilan-ver" className="text-sm text-primary hover:underline">
                İlk ilanı sen ver →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(p => (
                <Link key={p.id} href={`/kart/${p.id}`} className="group block">
                  <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all">
                    <div className="relative bg-gray-50 flex items-center justify-center" style={{ aspectRatio: '5/7' }}>
                      {p.image_url ? (
                        <Image
                          src={p.image_url}
                          alt={p.name}
                          fill
                          className="object-contain p-3"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="w-16 h-22 rounded-lg bg-gray-200" />
                      )}
                      {p.count > 1 && (
                        <span className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
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
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
