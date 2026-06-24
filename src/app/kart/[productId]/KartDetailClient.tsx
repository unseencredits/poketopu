'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, MapPin, Package, Truck, Users } from 'lucide-react'
import ConditionBadge from '@/components/shared/ConditionBadge'
import MessageButton from '@/components/listing/MessageButton'
import PriceHistoryChart from '@/components/shared/PriceHistoryChart'
import CollectionButton from '@/components/shared/CollectionButton'
import WatchlistButton from '@/components/shared/WatchlistButton'
import OfferButton from '@/components/listing/OfferButton'
import type { Condition } from '@/types'
import type { PricePoint } from '@/components/shared/PriceHistoryChart'

interface SellerListing {
  id: string
  price: number
  condition: Condition
  grader: string | null
  grade: number | null
  city: string | null
  shipping: string | null
  notes: string | null
  photos: string[]
  created_at: string
  store: { id: string; name: string; slug: string; user_id: string } | null
}

interface Product {
  id: string
  name: string
  set_name: string | null
  number: string | null
  rarity: string | null
  image_url: string | null
  image_url_hires: string | null
}

interface TCGPrices {
  tcgplayer: {
    updatedAt: string
    prices: Record<string, { low: number; mid: number; high: number; market: number }>
  } | null
  cardmarket: {
    updatedAt: string
    prices: {
      averageSellPrice: number
      trendPrice: number
      lowPrice: number
      avg7: number
      avg30: number
    }
  } | null
}

interface Props {
  product: Product
  listings: SellerListing[]
  priceHistory: PricePoint[]
  tcgPrices: TCGPrices
}

export default function KartDetailClient({ product, listings, priceHistory, tcgPrices }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activePhoto, setActivePhoto] = useState<string | null>(null)

  const selected = listings.find(l => l.id === selectedId)
  const sellerPhotos = selected?.photos?.length ? selected.photos : null
  const mainPhoto = activePhoto ?? sellerPhotos?.[0] ?? product.image_url_hires ?? product.image_url

  function selectSeller(id: string) {
    if (selectedId === id) {
      setSelectedId(null)
      setActivePhoto(null)
    } else {
      setSelectedId(id)
      setActivePhoto(null)
    }
  }

  function prevPhoto() {
    if (!sellerPhotos?.length) return
    const currentIdx = sellerPhotos.indexOf(activePhoto ?? sellerPhotos[0])
    setActivePhoto(sellerPhotos[(currentIdx - 1 + sellerPhotos.length) % sellerPhotos.length])
  }

  function nextPhoto() {
    if (!sellerPhotos?.length) return
    const currentIdx = sellerPhotos.indexOf(activePhoto ?? sellerPhotos[0])
    setActivePhoto(sellerPhotos[(currentIdx + 1) % sellerPhotos.length])
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

      {/* Sol: Görsel + seçili satıcı bilgisi */}
      <div className="flex flex-col gap-4">

        {/* Ana görsel */}
        <div
          className="relative w-full max-w-sm mx-auto lg:mx-0"
          style={{ aspectRatio: '5/7' }}
        >
          <div className="relative w-full h-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            {mainPhoto ? (
              <Image src={mainPhoto} alt={product.name} fill sizes="(max-width: 640px) calc(100vw - 32px), 384px" className="object-contain p-4" priority />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-32 rounded-xl bg-gray-200" />
              </div>
            )}
          </div>

          {sellerPhotos && sellerPhotos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 border border-gray-100 shadow-sm flex items-center justify-center hover:bg-white transition-colors z-10"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 border border-gray-100 shadow-sm flex items-center justify-center hover:bg-white transition-colors z-10"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {sellerPhotos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(url)}
                    className={`h-1.5 rounded-full transition-all ${
                      (activePhoto ?? sellerPhotos[0]) === url ? 'w-4 bg-primary' : 'w-1.5 bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail şeridi — birden fazla fotoğraf varsa */}
        {sellerPhotos && sellerPhotos.length > 1 && (
          <div className="flex gap-2 max-w-sm mx-auto lg:mx-0 overflow-x-auto pb-1">
            {sellerPhotos.map((url, i) => (
              <button
                key={i}
                onClick={() => setActivePhoto(url)}
                className={`relative flex-shrink-0 w-14 rounded-xl overflow-hidden border-2 transition-colors ${
                  (activePhoto ?? sellerPhotos[0]) === url ? 'border-primary' : 'border-gray-100'
                }`}
                style={{ aspectRatio: '5/7' }}
              >
                <Image src={url} alt={`Fotoğraf ${i + 1}`} fill sizes="80px" className="object-contain p-1 bg-gray-50" />
              </button>
            ))}
          </div>
        )}

        {/* Seçili satıcı detayı */}
        {selected ? (
          <div className="rounded-2xl border border-primary/30 bg-red-50/30 p-4 max-w-sm mx-auto lg:mx-0 w-full">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {selected.grader && selected.grade != null ? (
                <ConditionBadge grader={selected.grader} grade={selected.grade} />
              ) : (
                <ConditionBadge condition={selected.condition} showLabel size="sm" />
              )}
              {selected.store && (
                <Link
                  href={`/magaza/${selected.store.slug}`}
                  className="text-sm font-semibold text-gray-900 hover:text-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  {selected.store.name}
                </Link>
              )}
              {selected.store && (
                <Link
                  href={`/magaza/${selected.store.slug}`}
                  className="ml-auto text-xs text-primary border border-primary/30 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Profili Gör →
                </Link>
              )}
            </div>
            {selected.notes ? (
              <p className="text-sm text-gray-600 leading-relaxed">{selected.notes}</p>
            ) : (
              <p className="text-xs text-gray-400 italic">Satıcı açıklama eklememiş.</p>
            )}
            {(selected.city || selected.shipping) && (
              <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-red-100/60">
                {selected.city && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    {selected.city}
                  </span>
                )}
                {selected.shipping === 'kargo' && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Package className="h-3 w-3 text-gray-400" />
                    Kargo
                  </span>
                )}
                {selected.shipping === 'elden' && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Users className="h-3 w-3 text-gray-400" />
                    Elden teslim
                  </span>
                )}
                {selected.shipping === 'her_ikisi' && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Truck className="h-3 w-3 text-gray-400" />
                    Kargo veya elden
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-sm mx-auto lg:mx-0 w-full">
            <p className="text-xs text-gray-400">
              Satıcıya tıklayarak fotoğraflarını ve açıklamasını görebilirsin.
            </p>
          </div>
        )}
      </div>

      {/* Sağ: Ürün bilgisi + satıcı listesi */}
      <div className="flex flex-col gap-5">

        {/* Kart bilgisi */}
        <div>
          {product.set_name && (
            <p className="text-sm text-gray-400 mb-1">{product.set_name}</p>
          )}
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {product.name}
            {product.number && (
              <span className="text-gray-400 font-normal text-xl ml-2">#{product.number}</span>
            )}
          </h1>
          {product.rarity && (
            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-3 py-1 w-fit mt-2">
              {product.rarity}
            </p>
          )}
        </div>

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
                  onClick={() => selectSeller(listing.id)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    selectedId === listing.id
                      ? 'border-primary bg-red-50/40 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  {/* Üst satır: satıcı adı + durum + fiyat */}
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-gray-900 truncate block">
                        {listing.store?.name ?? 'Satıcı'}
                      </span>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {listing.grader && listing.grade != null ? (
                          <ConditionBadge grader={listing.grader} grade={listing.grade} />
                        ) : (
                          <ConditionBadge condition={listing.condition} showLabel size="sm" />
                        )}
                        {listing.photos?.length > 0 && (
                          <span className="text-xs text-gray-400">{listing.photos.length} fotoğraf</span>
                        )}
                      </div>
                      {(listing.city || listing.shipping) && (
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {listing.city && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-gray-400">
                              <MapPin className="h-3 w-3" />
                              {listing.city}
                            </span>
                          )}
                          {listing.shipping === 'kargo' && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-gray-400">
                              <Package className="h-3 w-3" />
                              Kargo
                            </span>
                          )}
                          {listing.shipping === 'elden' && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-gray-400">
                              <Users className="h-3 w-3" />
                              Elden
                            </span>
                          )}
                          {listing.shipping === 'her_ikisi' && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-gray-400">
                              <Truck className="h-3 w-3" />
                              Kargo/Elden
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xl font-bold text-gray-900 flex-shrink-0 leading-tight">
                      {listing.price.toLocaleString('tr-TR')} ₺
                    </p>
                  </div>

                  {/* Alt satır: aksiyon butonları */}
                  <div
                    className="flex items-center gap-2 mt-3"
                    onClick={e => e.stopPropagation()}
                  >
                    <OfferButton
                      listingId={listing.id}
                      sellerId={listing.store?.user_id ?? ''}
                      listingPrice={listing.price}
                    />
                    {listing.store && (
                      <MessageButton
                        listingId={listing.id}
                        sellerId={listing.store.user_id}
                        compact
                      />
                    )}
                    {listing.store && (
                      <Link
                        href={`/magaza/${listing.store.slug}`}
                        className="text-xs text-gray-400 hover:text-primary border border-gray-200 hover:border-primary/30 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Profil
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Referans Fiyatlar */}
        {(tcgPrices.tcgplayer || tcgPrices.cardmarket) && (
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Referans Fiyatlar</p>
            <div className="space-y-3">

              {/* Cardmarket */}
              {tcgPrices.cardmarket && (() => {
                const cm = tcgPrices.cardmarket!.prices
                return (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-700">Cardmarket</span>
                      <span className="text-[10px] text-gray-400">EUR · {tcgPrices.cardmarket!.updatedAt}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Satış Ort.', value: cm.averageSellPrice },
                        { label: '7 Gün Ort.', value: cm.avg7 },
                        { label: '30 Gün Ort.', value: cm.avg30 },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-white rounded-xl p-2.5 text-center border border-gray-100">
                          <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
                          <p className="text-sm font-bold text-gray-900">{value.toFixed(2)} €</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2 text-xs text-gray-500">
                      <span>En düşük: <span className="font-medium text-gray-700">{cm.lowPrice.toFixed(2)} €</span></span>
                      <span>·</span>
                      <span>Trend: <span className="font-medium text-gray-700">{cm.trendPrice.toFixed(2)} €</span></span>
                    </div>
                  </div>
                )
              })()}

              {/* TCGPlayer */}
              {tcgPrices.tcgplayer && tcgPrices.tcgplayer.prices && (() => {
                const prices = tcgPrices.tcgplayer!.prices
                const variants = Object.entries(prices)
                const variantLabels: Record<string, string> = {
                  normal: 'Normal',
                  holofoil: 'Holofoil',
                  reverseHolofoil: 'Reverse Holo',
                  '1stEditionHolofoil': '1st Ed. Holo',
                  '1stEditionNormal': '1st Ed. Normal',
                }
                return (
                  <div className={tcgPrices.cardmarket ? 'pt-3 border-t border-gray-100' : ''}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-700">TCGPlayer</span>
                      <span className="text-[10px] text-gray-400">USD · {tcgPrices.tcgplayer!.updatedAt}</span>
                    </div>
                    <div className="space-y-2">
                      {variants.map(([variant, p]) => (
                        <div key={variant} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-gray-100">
                          <span className="text-xs text-gray-600">{variantLabels[variant] ?? variant}</span>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-gray-400">Low: <span className="text-gray-600">${p.low.toFixed(2)}</span></span>
                            <span className="font-bold text-gray-900">${p.market.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* Koleksiyon + Takip butonları */}
        <div className="flex flex-col gap-2">
          <CollectionButton productId={product.id} />
          <WatchlistButton productId={product.id} />
        </div>

        {/* Fiyat Geçmişi */}
        {priceHistory.length > 0 && (
          <div className="pt-5 border-t border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Fiyat Geçmişi
            </h2>
            <PriceHistoryChart data={priceHistory} />
          </div>
        )}
      </div>
    </div>
  )
}
