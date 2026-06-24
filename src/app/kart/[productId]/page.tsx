import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import KartDetailClient from './KartDetailClient'
import type { Condition } from '@/types'
import type { PricePoint } from '@/components/shared/PriceHistoryChart'

interface PageProps {
  params: Promise<{ productId: string }>
}

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

export default async function KartPage({ params }: PageProps) {
  const { productId } = await params
  const supabase = await createClient()

  const [{ data: product }, { data: rawListings }, { data: allListings }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, set_name, set_id, series, number, rarity, image_url, image_url_hires')
      .eq('id', productId)
      .single(),
    supabase
      .from('listings')
      .select('id, price, condition, grader, grade, city, shipping, notes, photos, created_at, store:stores(id, name, slug, user_id)')
      .eq('product_id', productId)
      .eq('status', 'active')
      .order('price', { ascending: true }),
    supabase
      .from('listings')
      .select('id, price')
      .eq('product_id', productId),
  ])

  if (!product) notFound()

  const listings = (rawListings ?? []) as unknown as SellerListing[]

  // pokemontcg.io'dan referans fiyatları çek
  let tcgPrices: TCGPrices = { tcgplayer: null, cardmarket: null }
  try {
    const res = await fetch(
      `https://api.pokemontcg.io/v2/cards/${productId}?select=tcgplayer,cardmarket`,
      { next: { revalidate: 3600 } }
    )
    if (res.ok) {
      const json = await res.json()
      tcgPrices = {
        tcgplayer: json.data?.tcgplayer ?? null,
        cardmarket: json.data?.cardmarket ?? null,
      }
    }
  } catch {
    // sessizce geç
  }

  // Fiyat geçmişi: bu ürünle ilgili tüm satışlar
  const listingIds = (allListings ?? []).map((l: { id: string }) => l.id)
  let priceHistory: PricePoint[] = []

  if (listingIds.length > 0) {
    const { data: salesData } = await supabase
      .from('sales')
      .select('listing_id, created_at, price')
      .in('listing_id', listingIds)
      .eq('sold_outside', false)
      .order('created_at', { ascending: true })
      .limit(60)

    const priceMap = Object.fromEntries(
      (allListings ?? []).map((l: { id: string; price: number }) => [l.id, l.price])
    )

    priceHistory = (salesData ?? [])
      .map((s: { listing_id: string; created_at: string; price: number | null }) => ({
        date: s.created_at,
        price: s.price ?? priceMap[s.listing_id] ?? null,
      }))
      .filter((p): p is PricePoint => p.price != null)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/kartlar" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4" /> Kartlar
      </Link>

      <KartDetailClient product={product} listings={listings} priceHistory={priceHistory} tcgPrices={tcgPrices} />
    </div>
  )
}
