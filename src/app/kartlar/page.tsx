import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSets } from '@/lib/pokemon-tcg'
import ListingGrid from '@/components/cards/ListingGrid'
import MobileFilter from './MobileFilter'
import type { Listing } from '@/types'
import type { TCGSet } from '@/lib/pokemon-tcg'

interface Props {
  searchParams: Promise<Record<string, string>>
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

async function getListings(seri: string | null, setId: string | null): Promise<{ listings: Listing[]; total: number }> {
  const supabase = await createClient()

  let productIds: string[] | null = null

  if (setId) {
    // Belirli bir set seçili
    const { data: prods } = await supabase
      .from('products')
      .select('id')
      .eq('set_id', setId)
    productIds = (prods ?? []).map((p: { id: string }) => p.id)
    if (!productIds.length) return { listings: [], total: 0 }
  } else if (seri) {
    // Sadece seri seçili
    const { data: prods } = await supabase
      .from('products')
      .select('id')
      .eq('series', seri)
    productIds = (prods ?? []).map((p: { id: string }) => p.id)
    if (!productIds.length) return { listings: [], total: 0 }
  }

  let query = supabase
    .from('listings')
    .select('*, product:products(id,name,set_name,set_id,series,number,image_url), store:stores(id,name,slug)', { count: 'exact' })
    .eq('status', 'active')
    .eq('category', 'card')
    .order('created_at', { ascending: false })
    .limit(48)

  if (productIds) {
    query = query.in('product_id', productIds)
  }

  const { data, count } = await query
  return { listings: (data as Listing[]) ?? [], total: count ?? 0 }
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

  const { listings, total } = await getListings(selectedSeri, selectedSetId)

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
              <p className="text-sm text-gray-400 mt-0.5">{total.toLocaleString('tr-TR')} ilan</p>
            </div>

            {/* Mobil: bottom sheet filtre */}
            <div className="lg:hidden flex-shrink-0 mt-0.5">
              <MobileFilter
                setsBySeries={setsBySeries}
                selectedSeri={selectedSeri}
                selectedSetId={selectedSetId}
                selectedSetName={selectedSet?.name ?? null}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            <ListingGrid
              listings={listings}
              emptyMessage={
                selectedSet
                  ? `${selectedSet.name} setinde henüz ilan yok.`
                  : selectedSeri
                    ? `${selectedSeri} serisinde henüz ilan yok.`
                    : 'Henüz kart ilanı yok.'
              }
            />
          </div>

          {listings.length === 0 && (
            <div className="text-center mt-4">
              <Link href="/ilan-ver" className="text-sm text-primary hover:underline">
                İlk ilanı sen ver →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
