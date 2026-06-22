import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Store, Star, Package, Calendar, ChevronLeft } from 'lucide-react'
import ListingGrid from '@/components/cards/ListingGrid'
import type { Listing, Store as StoreType } from '@/types'

interface RatingRow {
  stars: number
  tags: string[]
  comment: string | null
  created_at: string
  reviewer_username: string | null
}

export default async function MagazaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from('stores')
    .select('*, profile:profiles(username, avatar_url, created_at)')
    .eq('slug', slug)
    .single() as { data: StoreType | null }

  if (!store) notFound()

  const [{ data: listings }, { data: rawRatings }, { count: salesCount }] = await Promise.all([
    supabase
      .from('listings')
      .select('*, product:products(id,name,set_name,number,image_url), store:stores(id,name,slug)')
      .eq('seller_id', store.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(40),

    supabase
      .from('ratings')
      .select('stars, tags, comment, created_at, reviewer_id')
      .eq('seller_store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(50),

    supabase
      .from('sales')
      .select('id', { count: 'exact', head: true })
      .eq('seller_store_id', store.id)
      .eq('sold_outside', false),
  ])

  const activeListings = (listings as Listing[] | null) ?? []

  // Reviewer profilleri ayrı sorgula
  const reviewerIds = [...new Set((rawRatings ?? []).map((r: { reviewer_id: string }) => r.reviewer_id))]
  const reviewerMap = new Map<string, string>()
  if (reviewerIds.length > 0) {
    const { data: reviewerProfiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', reviewerIds)
    for (const p of reviewerProfiles ?? []) {
      reviewerMap.set(p.id, p.username)
    }
  }

  const ratings: RatingRow[] = (rawRatings ?? []).map((r: { stars: number; tags: string[]; comment: string | null; created_at: string; reviewer_id: string }) => ({
    stars: r.stars,
    tags: r.tags ?? [],
    comment: r.comment,
    created_at: r.created_at,
    reviewer_username: reviewerMap.get(r.reviewer_id) ?? null,
  }))

  const avgStars = ratings.length > 0
    ? ratings.reduce((acc, r) => acc + r.stars, 0) / ratings.length
    : 0

  const isTrustedSeller = (salesCount ?? 0) >= 5 && ratings.length >= 3 && avgStars >= 4.0

  const tagCounts: Record<string, number> = {}
  for (const r of ratings) {
    for (const tag of r.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
    }
  }
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)

  function StarDisplay({ value, size = 'sm' }: { value: number; size?: 'sm' | 'lg' }) {
    const cls = size === 'lg' ? 'h-6 w-6' : 'h-3.5 w-3.5'
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
          <Star key={s} className={`${cls} ${s <= Math.round(value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/ara" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4" /> İlanlar
      </Link>

      {/* Mağaza banner */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 mb-8 text-white">
        <div className="flex items-start gap-5">
          <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
            {store.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logo_url} alt={store.name} className="h-12 w-12 rounded-xl object-cover" />
            ) : (
              <Store className="h-8 w-8 text-white/60" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <h1 className="text-2xl font-bold">{store.name}</h1>
              {store.is_verified && (
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium">✓ Onaylı</span>
              )}
              {isTrustedSeller && (
                <span className="bg-white/15 text-white/80 border border-white/20 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  Aktif Satıcı
                </span>
              )}
            </div>
            {store.description && (
              <p className="text-white/60 text-sm mt-1 leading-relaxed">{store.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-white/50">
              <span className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5" /> {activeListings.length} aktif ilan
              </span>
              {(salesCount ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  {salesCount} satış
                </span>
              )}
              {ratings.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-white font-semibold">{avgStars.toFixed(1)}</span>
                  <span>({ratings.length} değerlendirme)</span>
                </span>
              )}
              {store.profile?.created_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(store.profile.created_at).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} üye
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* İlanlar */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          İlanlar <span className="text-gray-400 font-normal text-base">({activeListings.length})</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ListingGrid listings={activeListings} emptyMessage="Bu mağazada henüz ilan yok." />
        </div>
      </div>

      {/* Değerlendirmeler */}
      {ratings.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-5">
            Değerlendirmeler <span className="text-gray-400 font-normal text-base">({ratings.length})</span>
          </h2>

          {/* Özet */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4 flex flex-col sm:flex-row gap-6">
            {/* Ortalama puan */}
            <div className="flex flex-col items-center justify-center sm:pr-6 sm:border-r sm:border-gray-100 min-w-[100px]">
              <p className="text-5xl font-bold text-gray-900">{avgStars.toFixed(1)}</p>
              <StarDisplay value={avgStars} size="sm" />
              <p className="text-xs text-gray-400 mt-1">{ratings.length} değerlendirme</p>
            </div>

            {/* Popüler etiketler */}
            {topTags.length > 0 && (
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Öne Çıkan</p>
                <div className="flex flex-wrap gap-2">
                  {topTags.map(([tag, count]) => (
                    <span key={tag} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-800 font-medium">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {tag}
                      <span className="text-yellow-500 font-normal text-xs">×{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Yorumlar */}
          {ratings.filter(r => r.comment).length > 0 && (
            <div className="space-y-3">
              {ratings.filter(r => r.comment).slice(0, 5).map((r, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                      {(r.reviewer_username ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">@{r.reviewer_username ?? 'kullanıcı'}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(r.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <StarDisplay value={r.stars} size="sm" />
                  </div>
                  {r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {r.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-gray-700 leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
