import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import ConditionBadge from '@/components/shared/ConditionBadge'
import MessageButton from '@/components/listing/MessageButton'
import type { Condition } from '@/types'

interface PageProps {
  params: Promise<{ productId: string }>
}

interface SellerListing {
  id: string
  price: number
  condition: Condition
  notes: string | null
  created_at: string
  store: { id: string; name: string; slug: string; user_id: string } | null
}

export default async function KartPage({ params }: PageProps) {
  const { productId } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('id, name, set_name, set_id, series, number, rarity, image_url, image_url_hires')
    .eq('id', productId)
    .single()

  if (!product) notFound()

  const { data: rawListings } = await supabase
    .from('listings')
    .select('id, price, condition, notes, created_at, store:stores(id, name, slug, user_id)')
    .eq('product_id', productId)
    .eq('status', 'active')
    .order('price', { ascending: true })

  const listings = (rawListings ?? []) as unknown as SellerListing[]
  const image = product.image_url_hires ?? product.image_url

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/kartlar" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4" /> Kartlar
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* Sol: Kart görseli */}
        <div className="flex justify-center lg:justify-start">
          <div
            className="relative w-full max-w-xs bg-gray-50 rounded-2xl overflow-hidden border border-gray-100"
            style={{ aspectRatio: '5/7' }}
          >
            {image ? (
              <Image src={image} alt={product.name} fill className="object-contain p-4" priority />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-32 rounded-xl bg-gray-200" />
              </div>
            )}
          </div>
        </div>

        {/* Sağ: Bilgi + satıcılar */}
        <div className="flex flex-col gap-5">
          {product.set_name && (
            <p className="text-sm text-gray-400">{product.set_name}</p>
          )}

          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {product.name}
            {product.number && (
              <span className="text-gray-400 font-normal text-xl ml-2">#{product.number}</span>
            )}
          </h1>

          {product.rarity && (
            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-3 py-1 w-fit">
              {product.rarity}
            </p>
          )}

          {/* Satıcı listesi */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {listings.length > 0 ? `${listings.length} satıcı` : 'Henüz ilan yok'}
            </h2>

            {listings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <p className="text-sm text-gray-400 mb-3">Bu kart için henüz ilan yok.</p>
                <Link href="/ilan-ver" className="text-sm text-primary font-medium hover:underline">
                  İlk ilanı sen ver →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {listings.map(listing => (
                  <div
                    key={listing.id}
                    className="rounded-2xl border border-gray-100 bg-white p-4 flex items-center gap-4 hover:border-gray-200 transition-colors"
                  >
                    {/* Kondisyon */}
                    <div className="flex-shrink-0">
                      <ConditionBadge condition={listing.condition} showLabel={false} size="sm" />
                    </div>

                    {/* Satıcı + not */}
                    <div className="flex-1 min-w-0">
                      {listing.store ? (
                        <Link
                          href={`/magaza/${listing.store.slug}`}
                          className="text-sm font-medium text-gray-900 hover:text-primary truncate block"
                        >
                          {listing.store.name}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-gray-900">Satıcı</p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <ConditionBadge condition={listing.condition} showLabel={true} size="sm" />
                        {listing.notes && (
                          <p className="text-xs text-gray-400 truncate">{listing.notes}</p>
                        )}
                      </div>
                    </div>

                    {/* Fiyat + mesaj */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      <p className="text-xl font-bold text-gray-900">
                        {listing.price.toLocaleString('tr-TR')} ₺
                      </p>
                      {listing.store && (
                        <MessageButton
                          listingId={listing.id}
                          sellerId={listing.store.user_id}
                          compact
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
