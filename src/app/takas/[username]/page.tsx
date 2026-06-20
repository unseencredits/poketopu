import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, User, Package, Search } from 'lucide-react'
import ConditionBadge from '@/components/shared/ConditionBadge'
import TradeMessageButton from '../TradeMessageButton'
import type { Trade } from '@/types'

export default async function UserTradePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bio')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: rawTrades } = await supabase
    .from('trades')
    .select('*, product:products(id,name,set_name,number,image_url)')
    .eq('user_id', profile.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const trades = (rawTrades as unknown as Trade[]) ?? []
  const haveTrades = trades.filter(t => t.type === 'have')
  const wantTrades = trades.filter(t => t.type === 'want')

  if (trades.length === 0) notFound()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Geri */}
      <Link
        href="/takas"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft className="h-4 w-4" /> Takas
      </Link>

      {/* Profil başlığı */}
      <div className="flex items-center justify-between gap-4 mb-8 p-5 bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.username}
                width={56}
                height={56}
                className="object-cover"
              />
            ) : (
              <User className="h-7 w-7 text-gray-400" />
            )}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">@{profile.username}</p>
            {profile.bio && (
              <p className="text-sm text-gray-500 mt-0.5">{profile.bio}</p>
            )}
            <div className="flex items-center gap-3 mt-1">
              {haveTrades.length > 0 && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                  {haveTrades.length} kart elimde
                </span>
              )}
              {wantTrades.length > 0 && (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-medium">
                  {wantTrades.length} kart arıyor
                </span>
              )}
            </div>
          </div>
        </div>
        <TradeMessageButton tradeUserId={profile.id} />
      </div>

      {/* Elimde Mevcut */}
      {haveTrades.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-900">Elimde Mevcut</h2>
            <span className="text-sm text-gray-400 ml-1">({haveTrades.length})</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {haveTrades.map(trade => (
              <TradePortfolioCard key={trade.id} trade={trade} />
            ))}
          </div>
        </section>
      )}

      {/* Arıyorum */}
      {wantTrades.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-bold text-gray-900">Arıyorum</h2>
            <span className="text-sm text-gray-400 ml-1">({wantTrades.length})</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {wantTrades.map(trade => (
              <TradePortfolioCard key={trade.id} trade={trade} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function TradePortfolioCard({ trade }: { trade: Trade }) {
  const title = trade.custom_title ?? trade.product?.name ?? 'İsimsiz'
  const photo = trade.photos?.[0] ?? trade.product?.image_url ?? null

  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
      {/* Görsel */}
      <div className="relative bg-gray-50" style={{ aspectRatio: '5/7' }}>
        {photo ? (
          <Image
            src={photo}
            alt={title}
            fill
            className="object-contain p-2"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-14 rounded bg-gray-200" />
          </div>
        )}
        {trade.condition && (
          <div className="absolute top-2 left-2">
            <ConditionBadge condition={trade.condition} showLabel={false} size="sm" />
          </div>
        )}
      </div>

      {/* Bilgi */}
      <div className="p-2.5">
        <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug">{title}</p>
        {trade.product?.set_name && (
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{trade.product.set_name}</p>
        )}
        {trade.notes && (
          <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{trade.notes}</p>
        )}
      </div>
    </div>
  )
}
