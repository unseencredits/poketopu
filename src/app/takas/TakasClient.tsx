'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { User, ArrowRightLeft } from 'lucide-react'
import type { Trade } from '@/types'
import ConditionBadge from '@/components/shared/ConditionBadge'

interface Props {
  trades: Trade[]
  activeTab: 'have' | 'want'
}

export default function TakasClient({ trades, activeTab }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function setTab(tab: 'have' | 'want') {
    router.push(`${pathname}?tab=${tab}`)
  }

  return (
    <div>
      {/* Sekmeler */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('have')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'have'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Elimde Mevcut
        </button>
        <button
          onClick={() => setTab('want')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'want'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Arıyorum
        </button>
      </div>

      {trades.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <ArrowRightLeft className="h-8 w-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-3">
            {activeTab === 'have'
              ? 'Henüz kimse takas için kart paylaşmamış.'
              : 'Henüz kimse kart aramıyor.'}
          </p>
          <a href="/takas-ver" className="text-sm text-primary hover:underline">
            İlk takas ilanını sen ver →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {trades.map(trade => (
            <TradeCard key={trade.id} trade={trade} />
          ))}
        </div>
      )}
    </div>
  )
}

function TradeCard({ trade }: { trade: Trade }) {
  const title = trade.custom_title ?? trade.product?.name ?? 'İsimsiz'
  const photo = trade.photos?.[0] ?? trade.product?.image_url ?? null
  const username = trade.profile?.username

  return (
    <Link href={`/takas/${username}`} className="group block">
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all">
        {/* Fotoğraf */}
        <div className="relative bg-gray-50" style={{ aspectRatio: '5/7' }}>
          {photo ? (
            <Image
              src={photo}
              alt={title}
              fill
              className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-16 rounded-lg bg-gray-200" />
            </div>
          )}
          {trade.condition && (
            <div className="absolute top-2 left-2">
              <ConditionBadge condition={trade.condition} showLabel={false} size="sm" />
            </div>
          )}
        </div>

        {/* Bilgi */}
        <div className="p-3">
          <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {title}
          </p>
          {trade.product?.set_name && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{trade.product.set_name}</p>
          )}
          {trade.notes && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{trade.notes}</p>
          )}

          {/* Kullanıcı */}
          {username && (
            <div className="mt-2 flex items-center gap-1.5 pt-2 border-t border-gray-50">
              <div className="h-4 w-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <User className="h-2.5 w-2.5 text-gray-400" />
              </div>
              <p className="text-xs text-gray-400 truncate">@{username}</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
