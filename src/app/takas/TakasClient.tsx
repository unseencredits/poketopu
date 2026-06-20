'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { User, ArrowRightLeft } from 'lucide-react'
import type { Trade } from '@/types'
import ConditionBadge from '@/components/shared/ConditionBadge'
import TradeMessageButton from './TradeMessageButton'

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

  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden flex flex-col">
      {/* Fotoğraf */}
      <div className="relative bg-gray-50 flex items-center justify-center" style={{ aspectRatio: '5/7' }}>
        {photo ? (
          <Image
            src={photo}
            alt={title}
            fill
            className="object-contain p-3"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="w-12 h-16 rounded-lg bg-gray-200" />
        )}
        {trade.condition && (
          <div className="absolute top-2 left-2">
            <ConditionBadge condition={trade.condition} showLabel={false} size="sm" />
          </div>
        )}
      </div>

      {/* Bilgi */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{title}</p>
          {trade.product?.set_name && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{trade.product.set_name}</p>
          )}
        </div>

        {trade.notes && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{trade.notes}</p>
        )}

        <div className="mt-auto pt-2 border-t border-gray-50 space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="h-3 w-3 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 truncate">@{trade.profile?.username ?? '—'}</p>
          </div>
          <TradeMessageButton tradeUserId={trade.user_id} />
        </div>
      </div>
    </div>
  )
}
