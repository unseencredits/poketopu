import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { SlidersHorizontal } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import ListingGrid from '@/components/cards/ListingGrid'
import SearchFilters from './SearchFilters'
import type { Listing, Category, Condition } from '@/types'

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

async function getCardProducts(sp: Record<string, string>): Promise<{ products: ProductCard[]; total: number }> {
  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select('product_id, product:products(id,name,set_name,number,image_url)')
    .eq('status', 'active')
    .eq('category', 'card')
    .not('product_id', 'is', null)
    .limit(1000)

  if (sp.kondisyon) query = query.eq('condition', sp.kondisyon as Condition)
  if (sp.min) query = query.gte('price', Number(sp.min))
  if (sp.max) query = query.lte('price', Number(sp.max))

  if (sp.q) {
    const { data: matchedProds } = await supabase
      .from('products').select('id').ilike('name', `%${sp.q}%`)
    const ids = (matchedProds ?? []).map((p: { id: string }) => p.id)
    if (!ids.length) return { products: [], total: 0 }
    query = query.in('product_id', ids)
  }

  const { data } = await query

  const map = new Map<string, ProductCard>()
  for (const l of data ?? []) {
    if (!l.product_id || !l.product) continue
    const p = l.product as unknown as { id: string; name: string; set_name: string | null; number: string | null; image_url: string | null }
    const existing = map.get(l.product_id)
    if (existing) { existing.count++ }
    else { map.set(l.product_id, { id: p.id, name: p.name, set_name: p.set_name, number: p.number, image_url: p.image_url, count: 1 }) }
  }

  const products = Array.from(map.values()).sort((a, b) => b.count - a.count)
  return { products, total: products.length }
}

async function getListings(sp: Record<string, string>, excludeCards = false): Promise<{ listings: Listing[]; total: number }> {
  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select('*, product:products(id,name,set_name,set_id,number,image_url), store:stores(id,name,slug)', { count: 'exact' })
    .eq('status', 'active')

  if (sp.q) {
    const { data: matchedProds } = await supabase
      .from('products')
      .select('id')
      .ilike('name', `%${sp.q}%`)
    const matchedProdIds = (matchedProds ?? []).map((p: { id: string }) => p.id)

    if (matchedProdIds.length > 0) {
      query = query.or(`custom_title.ilike.%${sp.q}%,product_id.in.(${matchedProdIds.join(',')})`)
    } else {
      query = query.ilike('custom_title', `%${sp.q}%`)
    }
  }
  if (sp.kategori) query = query.eq('category', sp.kategori as Category)
  else if (excludeCards) query = query.neq('category', 'card')
  if (sp.kondisyon) query = query.eq('condition', sp.kondisyon as Condition)
  if (sp.derecelendiren) query = query.eq('grader', sp.derecelendiren)
  if (sp.puan_min) query = query.gte('grade', Number(sp.puan_min))
  if (sp.puan_max) query = query.lte('grade', Number(sp.puan_max))
  if (sp.min) query = query.gte('price', Number(sp.min))
  if (sp.max) query = query.lte('price', Number(sp.max))

  // Set filtresi: ürün tablosu üzerinden filtrele
  if (sp.set_id) {
    const { data: prods } = await supabase
      .from('products')
      .select('id')
      .eq('set_id', sp.set_id)
    const prodIds = (prods ?? []).map((p: { id: string }) => p.id)
    if (!prodIds.length) return { listings: [], total: 0 }
    query = query.in('product_id', prodIds)
  }

  if (sp.sirala === 'fiyat-asc') query = query.order('price', { ascending: true })
  else if (sp.sirala === 'fiyat-desc') query = query.order('price', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  const page = Number(sp.sayfa ?? 1)
  const PAGE_SIZE = 24
  query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  const { data, count } = await query
  return { listings: (data as Listing[]) ?? [], total: count ?? 0 }
}

export default async function AraPage({ searchParams }: Props) {
  const sp = await searchParams
  const isCardCategory = sp.kategori === 'card'
  const isAllCategory = !sp.kategori  // Tüm İlanlar

  // Kart ilanları: category=card veya tüm ilanlar durumunda grupla
  const { products, total: productTotal } = (isCardCategory || isAllCategory)
    ? await getCardProducts(sp)
    : { products: [] as ProductCard[], total: 0 }

  // Kart dışı ilanlar: category=card değilse getir; tüm ilanlar görünümünde kartları dışla
  const { listings, total: listingTotal } = isCardCategory
    ? { listings: [] as Listing[], total: 0 }
    : await getListings(sp, isAllCategory)

  const total = productTotal + listingTotal

  const KATEGORI_LABELS: Record<string, string> = {
    card: 'Kartlar', sealed: 'Sealed Ürünler', accessory: 'Aksesuarlar', graded: 'Derecelendirilmiş Kartlar',
  }

  // set_id varsa set adını veritabanından çek
  let setName: string | null = null
  if (sp.set_id && listings.length > 0) {
    setName = (listings[0] as Listing & { product?: { set_name?: string } }).product?.set_name ?? null
  } else if (sp.set_id) {
    const supabaseForTitle = await createClient()
    const { data: sampleProd } = await supabaseForTitle
      .from('products')
      .select('set_name')
      .eq('set_id', sp.set_id)
      .limit(1)
      .single()
    setName = sampleProd?.set_name ?? sp.set_id
  }

  const title = sp.q
    ? `"${sp.q}" için sonuçlar`
    : sp.set_id
      ? `${setName ?? sp.set_id} seti ilanları`
      : sp.kategori
        ? KATEGORI_LABELS[sp.kategori] ?? 'İlanlar'
        : 'Tüm İlanlar'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex gap-8">

        {/* Sidebar — desktop */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24 bg-white border border-gray-100 rounded-2xl p-5">
            <Suspense>
              <SearchFilters />
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

            {/* Mobil filtre butonu */}
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
                  <SearchFilters />
                </Suspense>
              </SheetContent>
            </Sheet>
          </div>

          {/* Kart ürünleri (category=card veya tüm ilanlar) */}
          {products.length > 0 && (
            <>
              {isAllCategory && listings.length > 0 && (
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Kartlar</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
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
            </>
          )}

          {/* Kart dışı ilanlar (tüm ilanlar veya diğer kategoriler) */}
          {!isCardCategory && (
            <>
              {isAllCategory && listings.length > 0 && products.length > 0 && (
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Diğer İlanlar</p>
              )}
              {listings.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  <ListingGrid listings={listings} emptyMessage="" />
                </div>
              ) : products.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                  <p className="text-sm text-gray-400 mb-3">
                    {sp.q ? `"${sp.q}" için ilan bulunamadı.` : 'Henüz ilan yok.'}
                  </p>
                  <a href="/ilan-ver" className="text-sm text-primary hover:underline">İlk ilanı sen ver →</a>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
