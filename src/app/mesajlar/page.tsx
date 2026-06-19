'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, Store } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ConvRow {
  id: string
  last_message_at: string
  listing: { id: string; custom_title: string | null; photos: string[]; product: { name: string; image_url: string } | null } | null
  buyer: { id: string; username: string } | null
  seller: { id: string; username: string } | null
  last_message: { content: string; sender_id: string } | null
  unread: number
}

export default function MesajlarPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [convs, setConvs] = useState<ConvRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/giris'); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('conversations')
        .select(`
          id, last_message_at,
          listing:listings(id, custom_title, photos, product:products(name, image_url)),
          buyer:profiles!conversations_buyer_id_fkey(id, username),
          seller:profiles!conversations_seller_id_fkey(id, username)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      if (!data) { setLoading(false); return }

      // Her konuşma için son mesajı ve okunmamış sayısını çek
      const enriched = await Promise.all(data.map(async (conv: any) => {
        const [{ data: msgs }, { count }] = await Promise.all([
          supabase.from('messages').select('content, sender_id').eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(1),
          supabase.from('messages').select('*', { count: 'exact', head: true }).eq('conversation_id', conv.id).eq('is_read', false).neq('sender_id', user.id),
        ])
        return { ...conv, last_message: msgs?.[0] ?? null, unread: count ?? 0 }
      }))

      setConvs(enriched)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-3">
        {[1,2,3].map(i => (
          <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-6 w-6 text-gray-400" />
        <h1 className="text-xl font-bold text-gray-900">Mesajlar</h1>
      </div>

      {convs.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-7 w-7 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">Henüz mesajın yok</p>
          <p className="text-sm text-gray-400 mt-1">Bir ilan sayfasından satıcıya mesaj gönder.</p>
          <Link href="/ara" className="inline-block mt-4 text-sm text-primary hover:underline">
            İlanları Keşfet →
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50 overflow-hidden">
          {convs.map(conv => {
            const other = conv.buyer?.id === userId ? conv.seller : conv.buyer
            const isMe = conv.last_message?.sender_id === userId
            const listingTitle = conv.listing?.custom_title ?? conv.listing?.product?.name ?? 'İlan'
            const thumb = conv.listing?.photos?.[0] ?? conv.listing?.product?.image_url ?? null
            const time = new Date(conv.last_message_at).toLocaleDateString('tr-TR', {
              day: 'numeric', month: 'short',
            })

            return (
              <Link
                key={conv.id}
                href={`/mesajlar/${conv.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                {/* İlan küçük resim */}
                <div className="h-12 w-9 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Store className="h-4 w-4 text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      @{other?.username ?? '—'}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {conv.unread > 0 && (
                        <span className="h-5 w-5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                          {conv.unread}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{time}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{listingTitle}</p>
                  {conv.last_message && (
                    <p className={`text-sm mt-0.5 truncate ${conv.unread > 0 ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                      {isMe ? 'Sen: ' : ''}{conv.last_message.content}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
