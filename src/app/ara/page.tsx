import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { SlidersHorizontal } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import ListingGrid from '@/components/cards/ListingGrid'
import SearchFilters from './SearchFilters'
import type { Listing, Category, Condition } from '@/types'

interface Props {
  searchParams: Promise<Record<string, string>>
}

async function getListings(sp: Record<string, string>): Promise<{ listings: Listing[]; total: number }> {
  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select('*, product:products(id,name,set_name,set_id,number,image_url), store:stores(id,name,slug)', { count: 'exact' })
    .eq('status', 'active')

  if (sp.q) {
    query = query.or(`custom_title.ilike.%${sp.q}%,product.name.ilike.%${sp.q}%`)
  }
  if (sp.kategori) query = query.eq('category', sp.kategori as Category)
  if (sp.kondisyon) query = query.eq('condition', sp.kondisyon as Condition)
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
  const { listings, total } = await getListings(sp)

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

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            <ListingGrid
              listings={listings}
              emptyMessage={sp.q ? `"${sp.q}" için ilan bulunamadı.` : 'Henüz ilan yok.'}
            />
          </div>

          {/* Boş durum CTA */}
          {listings.length === 0 && !sp.q && (
            <div className="text-center mt-4">
              <a href="/ilan-ver" className="text-sm text-primary hover:underline">
                İlk ilanı sen ver →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
