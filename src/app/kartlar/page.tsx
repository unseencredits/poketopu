export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { SlidersHorizontal } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ListingGrid from '@/components/cards/ListingGrid'
import KartlarFiltreler, { type SetInfo } from './KartlarFiltreler'
import type { Listing, Condition } from '@/types'

interface Props {
  searchParams: Promise<Record<string, string>>
}

const PAGE_SIZE = 20

async function getKartListings(
  sp: Record<string, string>,
): Promise<{ listings: Listing[]; total: number }> {
  const supabase = await createClient()

  // Set filtresi: 2 adım — önce set'e ait product_id'leri bul
  let productIds: string[] | null = null
  if (sp.set_id) {
    const { data: prods } = await supabase
      .from('products')
      .select('id')
      .eq('set_id', sp.set_id)
    productIds = (prods ?? []).map((p: { id: string }) => p.id)
    if (!productIds.length) return { listings: [], total: 0 }
  }

  let query = supabase
    .from('listings')
    .select(
      '*, product:products(id,name,set_name,set_id,number,image_url), store:stores(id,name,slug)',
      { count: 'exact' },
    )
    .eq('status', 'active')
    .eq('category', 'card')

  if (productIds) query = query.in('product_id', productIds)
  if (sp.kondisyon) query = query.eq('condition', sp.kondisyon as Condition)
  if (sp.min)       query = query.gte('price', Number(sp.min))
  if (sp.max)       query = query.lte('price', Number(sp.max))
  if (sp.sehir)     query = query.ilike('city', `%${sp.sehir}%`)
  if (sp.teslimat === 'kargo') query = query.in('shipping', ['kargo', 'her_ikisi'])
  if (sp.teslimat === 'elden') query = query.in('shipping', ['elden', 'her_ikisi'])

  // Öne çıkarılan ilanlar önce (featured_until büyük = gelecek tarih = ilk sıra)
  // null değerler sona (nullsFirst: false)
  if (sp.sirala === 'fiyat-asc') {
    query = query
      .order('featured_until', { ascending: false, nullsFirst: false })
      .order('price', { ascending: true })
  } else if (sp.sirala === 'fiyat-desc') {
    query = query
      .order('featured_until', { ascending: false, nullsFirst: false })
      .order('price', { ascending: false })
  } else {
    query = query
      .order('featured_until', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
  }

  const page = Math.max(1, Number(sp.sayfa ?? 1))
  query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  const { data, count } = await query
  return { listings: (data as Listing[]) ?? [], total: count ?? 0 }
}

async function getActiveSets(): Promise<SetInfo[]> {
  const supabase = await createClient()

  // Adım 1: aktif kart ilanlarının product_id'lerini al
  const { data: listingRows } = await supabase
    .from('listings')
    .select('product_id')
    .eq('status', 'active')
    .eq('category', 'card')
    .not('product_id', 'is', null)

  if (!listingRows?.length) return []

  // Adım 2: o product_id'lere ait benzersiz set bilgilerini al
  const ids = [...new Set(listingRows.map(l => l.product_id as string))]
  const { data: prods } = await supabase
    .from('products')
    .select('set_id, set_name, series')
    .in('id', ids)
    .not('set_id', 'is', null)

  const seen = new Set<string>()
  const sets: SetInfo[] = []
  for (const p of prods ?? []) {
    if (p.set_id && !seen.has(p.set_id)) {
      seen.add(p.set_id)
      sets.push({ id: p.set_id, name: p.set_name ?? p.set_id, series: p.series ?? '' })
    }
  }
  return sets.sort((a, b) => a.name.localeCompare(b.name, 'tr'))
}

function Pagination({ page, totalPages, sp }: { page: number; totalPages: number; sp: Record<string, string> }) {
  if (totalPages <= 1) return null

  // Pencere: 7 sayfa göster (başta, sonda, ve aktif çevresinde)
  const pages: (number | '...')[] = []
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2)) {
      pages.push(p)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      {pages.map((p, i) => {
        if (p === '...') {
          return <span key={`dots-${i}`} className="w-9 text-center text-sm text-gray-400">…</span>
        }
        const next = new URLSearchParams()
        Object.entries(sp).forEach(([k, v]) => { if (k !== 'sayfa') next.set(k, v) })
        if (p > 1) next.set('sayfa', String(p))
        return (
          <Link
            key={p}
            href={`/kartlar${next.toString() ? `?${next.toString()}` : ''}`}
            className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${
              p === page
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary'
            }`}
          >
            {p}
          </Link>
        )
      })}
    </div>
  )
}

export default async function KartlarPage({ searchParams }: Props) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.sayfa ?? 1))

  const [{ listings, total }, sets] = await Promise.all([
    getKartListings(sp),
    getActiveSets(),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentSetName = sp.set_id ? sets.find(s => s.id === sp.set_id)?.name : null

  const title = currentSetName ? currentSetName : 'Kartlar'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex gap-8">

        {/* Sidebar — masaüstü */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24 bg-white border border-gray-100 rounded-2xl p-5">
            <Suspense>
              <KartlarFiltreler sets={sets} />
            </Suspense>
          </div>
        </aside>

        {/* Ana içerik */}
        <div className="flex-1 min-w-0">
          {/* Üst bar */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {total.toLocaleString('tr-TR')} ilan
              </p>
            </div>

            {/* Mobil filtre */}
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="outline" size="sm" className="lg:hidden gap-2 rounded-xl">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtrele
                  </Button>
                }
              />
              <SheetContent side="left" className="w-72 p-6 overflow-y-auto">
                <p className="font-semibold text-gray-900 mb-5">Filtreler</p>
                <Suspense>
                  <KartlarFiltreler sets={sets} />
                </Suspense>
              </SheetContent>
            </Sheet>
          </div>

          {/* İlan grid */}
          {listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <p className="text-sm text-gray-400 mb-3">Uygun ilan bulunamadı.</p>
              <Link href="/ilan-ver" className="text-sm text-primary hover:underline">
                İlk ilanı sen ver →
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                <ListingGrid listings={listings} />
              </div>
              <Pagination page={page} totalPages={totalPages} sp={sp} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
