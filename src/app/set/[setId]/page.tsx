import { createClient } from '@/lib/supabase/server'
import { getSets } from '@/lib/pokemon-tcg'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, LayoutGrid } from 'lucide-react'

interface PageProps {
  params: Promise<{ setId: string }>
}

export default async function SetPage({ params }: PageProps) {
  const { setId } = await params
  const supabase = await createClient()

  // Set bilgisini TCG API'den al
  const allSets = await getSets()
  const tcgSet = allSets.find(s => s.id === setId)
  if (!tcgSet) notFound()

  // Bu set'teki ürünleri DB'den al (kart numarasına göre sırala)
  const { data: products } = await supabase
    .from('products')
    .select('id, name, number, rarity, image_url')
    .eq('set_id', setId)
    .order('number', { ascending: true })

  const productList = products ?? []
  const productIds = productList.map(p => p.id)

  // Aktif ilan sayılarını al
  const listingCountMap: Record<string, number> = {}
  if (productIds.length > 0) {
    const { data: listings } = await supabase
      .from('listings')
      .select('product_id')
      .in('product_id', productIds)
      .eq('status', 'active')

    for (const l of listings ?? []) {
      if (!l.product_id) continue
      listingCountMap[l.product_id] = (listingCountMap[l.product_id] ?? 0) + 1
    }
  }

  const listedCount = productList.filter(p => listingCountMap[p.id] > 0).length
  const coveragePct = tcgSet.total > 0 ? Math.round((listedCount / tcgSet.total) * 100) : 0

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/kartlar"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft className="h-4 w-4" /> Kartlar
      </Link>

      {/* Set Başlığı */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 sm:p-8 mb-8 text-white">
        <div className="flex items-center gap-5">
          {tcgSet.images?.logo ? (
            <div className="flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tcgSet.images.logo}
                alt={tcgSet.name}
                className="h-12 object-contain"
              />
            </div>
          ) : (
            <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
              <LayoutGrid className="h-6 w-6 text-white/60" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white/50 text-sm">{tcgSet.series}</p>
            <h1 className="text-2xl font-bold">{tcgSet.name}</h1>
          </div>
          {tcgSet.images?.symbol && (
            <div className="flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tcgSet.images.symbol} alt="" className="h-8 opacity-60" />
            </div>
          )}
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold">{tcgSet.total}</p>
            <p className="text-white/50 text-xs mt-0.5">Toplam Kart</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold">{listedCount}</p>
            <p className="text-white/50 text-xs mt-0.5">İlanlı Kart</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold">{coveragePct}%</p>
            <p className="text-white/50 text-xs mt-0.5">Kapsama</p>
          </div>
        </div>

        {/* İlerleme çubuğu */}
        <div className="mt-4">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all"
              style={{ width: `${coveragePct}%` }}
            />
          </div>
          <p className="text-white/40 text-xs mt-1.5">
            {tcgSet.total - listedCount} kart henüz listelenmedi
          </p>
        </div>
      </div>

      {/* Kart Izgara */}
      {productList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <p className="text-sm text-gray-400 mb-3">Bu setten henüz kart listelenmemiş.</p>
          <Link href="/ilan-ver" className="text-sm text-primary hover:underline">
            İlk ilanı sen ver →
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{productList.length}</span> kart DB&apos;de
            </p>
            <Link href={`/kartlar?set_id=${setId}`} className="text-xs text-primary hover:underline">
              Sadece ilanlıları gör →
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {productList.map(p => {
              const count = listingCountMap[p.id] ?? 0
              const hasListing = count > 0
              return (
                <Link
                  key={p.id}
                  href={`/kart/${p.id}`}
                  className="group block"
                >
                  <div className={`rounded-xl border overflow-hidden transition-all ${
                    hasListing
                      ? 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                      : 'border-gray-100 bg-gray-50 opacity-60'
                  }`}>
                    <div className="relative bg-gray-50" style={{ aspectRatio: '5/7' }}>
                      {p.image_url ? (
                        <Image
                          src={p.image_url}
                          alt={p.name}
                          fill
                          className="object-contain p-2"
                          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 15vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-12 rounded bg-gray-200" />
                        </div>
                      )}
                      {hasListing && (
                        <span className="absolute top-1 right-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {count}
                        </span>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] font-medium text-gray-900 truncate leading-snug group-hover:text-primary transition-colors">
                        {p.name}
                      </p>
                      {p.number && (
                        <p className="text-[10px] text-gray-400">#{p.number}</p>
                      )}
                      <p className={`text-[10px] font-medium mt-0.5 ${hasListing ? 'text-emerald-600' : 'text-gray-300'}`}>
                        {hasListing ? `${count} ilan` : '—'}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
