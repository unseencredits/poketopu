'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { User, ArrowRightLeft, ChevronRight } from 'lucide-react'
import type { UserTradePreview } from '@/types'

interface Props {
  users: UserTradePreview[]
  activeTab: 'have' | 'want'
}

export default function TakasClient({ users, activeTab }: Props) {
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

      {users.length === 0 ? (
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
          {users.map(user => (
            <UserTradeCard key={user.userId} user={user} type={activeTab} />
          ))}
        </div>
      )}
    </div>
  )
}

function UserTradeCard({ user, type }: { user: UserTradePreview; type: 'have' | 'want' }) {
  const href = `/takas/${user.profile.username}`

  return (
    <Link href={href} className="group block">
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden hover:border-gray-200 hover:shadow-md transition-all">
        {/* Kart yelpazesi alanı */}
        <div className="relative bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4" style={{ minHeight: 140 }}>
          <CardFan images={user.cardImages} />
        </div>

        {/* Kullanıcı bilgisi */}
        <div className="p-3.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <User className="h-3 w-3 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-900 truncate">@{user.profile.username}</p>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 pl-6.5">
              {user.count === 1 ? '1 kart' : `${user.count} kart`}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors flex-shrink-0" />
        </div>
      </div>
    </Link>
  )
}

function CardFan({ images }: { images: string[] }) {
  if (images.length === 0) {
    return (
      <div className="h-24 w-16 rounded-xl bg-gray-200/60 flex items-center justify-center">
        <ArrowRightLeft className="h-6 w-6 text-gray-300" />
      </div>
    )
  }

  const displayed = images.slice(0, 4)
  const n = displayed.length

  // Her kart için rotasyon ve sol offset
  const rotations = [-12, -4, 4, 12]
  const offsets  = [-30, -10, 10, 30]

  return (
    <div className="relative flex items-end justify-center" style={{ height: 110, width: 140 }}>
      {displayed.map((src, i) => {
        const rot = n === 1 ? 0 : rotations[Math.round((i / (n - 1)) * 3)]
        const left = n === 1 ? 62 : 70 + offsets[Math.round((i / (n - 1)) * 3)]

        return (
          <div
            key={i}
            className="absolute bottom-0 w-14 h-20 rounded-xl overflow-hidden border-2 border-white shadow-md bg-gray-50"
            style={{
              left,
              zIndex: i + 1,
              transform: `rotate(${rot}deg)`,
              transformOrigin: 'bottom center',
            }}
          >
            <Image
              src={src}
              alt=""
              fill
              className="object-contain p-1"
              sizes="56px"
            />
          </div>
        )
      })}

      {/* +N rozeti */}
      {images.length > 4 && (
        <div
          className="absolute -top-1 -right-1 z-10 h-6 w-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shadow"
          style={{ right: 0, top: 0 }}
        >
          +{images.length - 4}
        </div>
      )}
    </div>
  )
}
