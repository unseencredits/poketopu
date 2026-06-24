import Link from 'next/link'
import Image from 'next/image'
import { Store, Sparkles } from 'lucide-react'
import ConditionBadge from '@/components/shared/ConditionBadge'
import type { Listing } from '@/types'

interface Props {
  listings: Listing[]
  emptyMessage?: string
}

export default function ListingGrid({ listings, emptyMessage = 'Sonuç bulunamadı.' }: Props) {
  if (!listings.length) {
    return (
      <div className="col-span-full py-20 text-center">
        <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Store className="h-7 w-7 text-gray-300" />
        </div>
        <p className="text-gray-500 font-medium">{emptyMessage}</p>
        <p className="text-sm text-gray-400 mt-1">Filtreni genişlet ya da farklı bir şey ara.</p>
      </div>
    )
  }

  return (
    <>
      {listings.map(listing => {
        const title = listing.custom_title ?? listing.product?.name ?? 'İsimsiz İlan'
        const photo = listing.photos?.[0] ?? listing.product?.image_url ?? null
        const setName = listing.product?.set_name

        const href = listing.product_id ? `/kart/${listing.product_id}` : `/ilan/${listing.id}`
        const isFeatured = listing.featured_until && new Date(listing.featured_until) > new Date()
        return (
          <Link href={href} key={listing.id} className="listing-card group block">
            <div className={`rounded-2xl border bg-white overflow-hidden h-full ${isFeatured ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-100'}`}>
              <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
                {photo ? (
                  <Image
                    src={photo}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                    unoptimized={photo.startsWith('https://images.pokemontcg.io')}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-14 rounded-lg bg-gray-200" />
                  </div>
                )}
                {listing.condition && (
                  <div className="absolute top-2 left-2">
                    <ConditionBadge condition={listing.condition} showLabel={false} size="sm" />
                  </div>
                )}
                {isFeatured && (
                  <div className="absolute top-2 right-2 bg-amber-400 text-white rounded-lg px-1.5 py-0.5 flex items-center gap-0.5">
                    <Sparkles className="h-2.5 w-2.5" />
                    <span className="text-[10px] font-bold leading-none">Öne Çıkan</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{title}</p>
                {setName && <p className="text-xs text-gray-400 mt-0.5 truncate">{setName}</p>}
                <div className="mt-2 flex items-end justify-between gap-1">
                  <p className="text-base font-bold text-gray-900">
                    {listing.price.toLocaleString('tr-TR')} ₺
                  </p>
                  {listing.condition && (
                    <ConditionBadge condition={listing.condition} size="sm" />
                  )}
                </div>
                {listing.store && (
                  <p className="text-xs text-gray-400 mt-1.5 truncate">{listing.store.name}</p>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </>
  )
}
