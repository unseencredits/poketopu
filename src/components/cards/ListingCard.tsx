import Link from 'next/link'
import Image from 'next/image'
import { MapPin } from 'lucide-react'
import type { Listing } from '@/types'
import ConditionBadge from '@/components/shared/ConditionBadge'

interface Props {
  listing: Listing
}

export default function ListingCard({ listing }: Props) {
  const title = listing.custom_title ?? listing.product?.name ?? 'İsimsiz İlan'
  const photo = listing.photos?.[0] ?? listing.product?.image_url ?? null
  const setName = listing.product?.set_name
  const isFeatured = listing.featured_until && new Date(listing.featured_until) > new Date()

  const href = listing.product_id ? `/kart/${listing.product_id}` : `/ilan/${listing.id}`

  return (
    <Link href={href} className="listing-card group block">
      <div className={`rounded-2xl border bg-white overflow-hidden ${isFeatured ? 'border-primary/60 shadow-sm shadow-primary/10' : 'border-gray-100'}`}>
        {/* Fotoğraf */}
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
              <div className="w-12 h-16 rounded-lg bg-gray-200" />
            </div>
          )}

          {isFeatured && (
            <div className="absolute top-2 right-2 z-10">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-white uppercase tracking-wide">Öne Çıkan</span>
            </div>
          )}
          {(listing.grader && listing.grade != null) ? (
            <div className="absolute top-2 left-2">
              <ConditionBadge grader={listing.grader} grade={listing.grade} showLabel={false} size="sm" />
            </div>
          ) : listing.condition ? (
            <div className="absolute top-2 left-2">
              <ConditionBadge condition={listing.condition} showLabel={false} size="sm" />
            </div>
          ) : null}
        </div>

        {/* Bilgi */}
        <div className="p-3">
          <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{title}</p>
          {(listing.grader && listing.grade != null) ? (
            <p className="text-xs font-bold text-violet-600 mt-0.5">
              {listing.grader} {listing.grade % 1 === 0 ? listing.grade.toFixed(0) : listing.grade}
            </p>
          ) : setName ? (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{setName}</p>
          ) : null}

          <div className="mt-2 flex items-end justify-between gap-2">
            <p className="text-base font-bold text-gray-900">
              {listing.price.toLocaleString('tr-TR')} ₺
            </p>
            {(listing.grader && listing.grade != null) ? (
              <ConditionBadge grader={listing.grader} grade={listing.grade} size="sm" />
            ) : listing.condition ? (
              <ConditionBadge condition={listing.condition} showLabel={true} size="sm" />
            ) : null}
          </div>

          {listing.store && (
            <div className="mt-2 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-gray-300 flex-shrink-0" />
              <p className="text-xs text-gray-400 truncate">{listing.store.name}</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
