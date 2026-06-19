import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Store, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ConditionBadge from '@/components/shared/ConditionBadge'
import MessageButton from '@/components/listing/MessageButton'
import IlanPhotoGallery from './IlanPhotoGallery'
import type { Listing } from '@/types'

export default async function IlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select('*, product:products(*), store:stores(*, profile:profiles(*))')
    .eq('id', id)
    .neq('status', 'deleted')
    .single() as { data: Listing | null }

  if (!listing) notFound()

  const title = listing.custom_title ?? listing.product?.name ?? 'İlan'
  const photos = listing.photos?.length ? listing.photos : listing.product?.image_url ? [listing.product.image_url] : []

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4" /> Ana Sayfa
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Sol: Fotoğraflar */}
        <div className="flex flex-col items-center">
          {photos.length > 0 ? (
            <IlanPhotoGallery photos={photos} alt={title} />
          ) : (
            <div className="relative w-full max-w-xs bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center" style={{ aspectRatio: '5/7' }}>
              <Store className="h-16 w-16 text-gray-200" />
            </div>
          )}
        </div>

        {/* Sağ: Detaylar */}
        <div className="flex flex-col gap-5">
          {listing.product?.set_name && (
            <p className="text-sm text-gray-400">{listing.product.set_name}</p>
          )}

          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {title}
            {listing.product?.number && (
              <span className="text-gray-400 font-normal text-xl ml-2">#{listing.product.number}</span>
            )}
          </h1>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-3xl font-bold text-gray-900">
              {listing.price.toLocaleString('tr-TR')} ₺
            </span>
            {listing.condition && <ConditionBadge condition={listing.condition} />}
            {listing.quantity > 1 && (
              <span className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 font-medium">
                Stokta {listing.quantity} adet
              </span>
            )}
          </div>

          {listing.notes && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 leading-relaxed">{listing.notes}</p>
          )}

          {/* Satıcı */}
          {listing.store && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Store className="h-5 w-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{listing.store.name}</p>
                <p className="text-xs text-gray-400">Satıcı</p>
              </div>
              <Link href={`/magaza/${listing.store.slug}`}>
                <Button variant="outline" size="sm" className="rounded-lg text-xs">
                  Mağaza
                </Button>
              </Link>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(listing.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>

          {/* Satıcıya mesaj */}
          {listing.store && (
            <div className="pt-2 space-y-3">
              <MessageButton
                listingId={listing.id}
                sellerId={listing.store.user_id}
              />
              <p className="text-center text-xs text-gray-400">
                Satın alma işlemi satıcı ile doğrudan gerçekleşir.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
