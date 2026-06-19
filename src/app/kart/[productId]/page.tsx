import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import KartDetailClient from './KartDetailClient'
import type { Condition } from '@/types'

interface PageProps {
  params: Promise<{ productId: string }>
}

interface SellerListing {
  id: string
  price: number
  condition: Condition
  notes: string | null
  photos: string[]
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
    .select('id, price, condition, notes, photos, created_at, store:stores(id, name, slug, user_id)')
    .eq('product_id', productId)
    .eq('status', 'active')
    .order('price', { ascending: true })

  const listings = (rawListings ?? []) as unknown as SellerListing[]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/kartlar" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4" /> Kartlar
      </Link>

      <KartDetailClient product={product} listings={listings} />
    </div>
  )
}
