import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Store, Star, Package, Calendar, ChevronLeft } from 'lucide-react'
import ListingGrid from '@/components/cards/ListingGrid'
import type { Listing, Store as StoreType } from '@/types'

export default async function MagazaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from('stores')
    .select('*, profile:profiles(username, avatar_url, created_at)')
    .eq('slug', slug)
    .single() as { data: StoreType | null }

  if (!store) notFound()

  const { data: listings } = await supabase
    .from('listings')
    .select('*, product:products(id,name,set_name,number,image_url), store:stores(id,name,slug)')
    .eq('seller_id', store.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(40) as { data: Listing[] | null }

  const activeListings = listings ?? []

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/magazalar" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4" /> Mağazalar
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{store.name}</h1>
              {store.is_verified && (
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium">✓ Onaylı</span>
              )}
            </div>
            {store.description && (
              <p className="text-white/60 text-sm mt-1 leading-relaxed">{store.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-white/50">
              <span className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5" /> {activeListings.length} aktif ilan
              </span>
              {store.rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" /> {store.rating.toFixed(1)}
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
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          İlanlar <span className="text-gray-400 font-normal text-base">({activeListings.length})</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ListingGrid
            listings={activeListings}
            emptyMessage="Bu mağazada henüz ilan yok."
          />
        </div>
      </div>
    </div>
  )
}
