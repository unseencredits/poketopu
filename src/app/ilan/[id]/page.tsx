import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, MessageCircle, Store, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ConditionBadge from '@/components/shared/ConditionBadge'
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
        <div>
          <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            {photos[0] ? (
              <Image
                src={photos[0]}
                alt={title}
                fill
                className="object-contain p-6"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-200">
                <Store className="h-16 w-16" />
              </div>
            )}
          </div>

          {photos.length > 1 && (
            <div className="flex gap-2 mt-3">
              {photos.map((url, i) => (
                <div key={i} className="relative h-16 w-16 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                  <Image src={url} alt={`${i + 1}`} fill className="object-contain p-1" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sağ: Detaylar */}
        <div className="flex flex-col gap-5">
          {listing.product && (
            <p className="text-sm text-gray-400">{listing.product.set_name} · #{listing.product.number}</p>
          )}

          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h1>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-900">
              {listing.price.toLocaleString('tr-TR')} ₺
            </span>
            {listing.condition && <ConditionBadge condition={listing.condition} />}
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
          <div className="pt-2 space-y-3">
            <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl gap-2">
              <MessageCircle className="h-5 w-5" />
              Satıcıya Mesaj Gönder
            </Button>
            <p className="text-center text-xs text-gray-400">
              Satın alma işlemi satıcı ile doğrudan gerçekleşir.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
