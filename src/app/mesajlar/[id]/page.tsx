'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Send, Store, CheckCircle, Star, HandshakeIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Msg {
  id: string
  content: string
  sender_id: string
  created_at: string
  is_read: boolean
}

interface ConvInfo {
  id: string
  buyer_id: string
  seller_id: string
  deal_agreed_buyer: boolean
  deal_agreed_seller: boolean
  listing: { id: string; custom_title: string | null; photos: string[]; product: { name: string; image_url: string | null } | null } | null
  buyer: { id: string; username: string } | null
  seller: { id: string; username: string } | null
}

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const convId = params.id

  const [userId, setUserId] = useState<string | null>(null)
  const [conv, setConv] = useState<ConvInfo | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  // Anlaşma + değerlendirme state
  const [dealAgreedBuyer, setDealAgreedBuyer] = useState(false)
  const [dealAgreedSeller, setDealAgreedSeller] = useState(false)
  const [agreeLoading, setAgreeLoading] = useState(false)
  const [ratingOpen, setRatingOpen] = useState(false)
  const [stars, setStars] = useState(5)
  const [comment, setComment] = useState('')
  const [ratingDone, setRatingDone] = useState(false)
  const [ratingLoading, setRatingLoading] = useState(false)

  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback((smooth = false) => {
    const el = messagesRef.current
    if (!el) return
    if (smooth) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    else el.scrollTop = el.scrollHeight
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let mounted = true

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return
      if (!user) { router.push('/giris'); return }
      setUserId(user.id)

      const { data: convData } = await supabase
        .from('conversations')
        .select(`
          id, buyer_id, seller_id, deal_agreed_buyer, deal_agreed_seller,
          listing:listings(id, custom_title, photos, product:products(name, image_url)),
          buyer:profiles!conversations_buyer_id_fkey(id, username),
          seller:profiles!conversations_seller_id_fkey(id, username)
        `)
        .eq('id', convId)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .single()

      if (!mounted) return
      if (!convData) { router.push('/mesajlar'); return }
      const c = convData as unknown as ConvInfo
      setConv(c)
      setDealAgreedBuyer(c.deal_agreed_buyer)
      setDealAgreedSeller(c.deal_agreed_seller)

      // Daha önce değerlendirme yapıldı mı?
      if (c.deal_agreed_buyer && c.deal_agreed_seller && user.id === c.buyer_id) {
        const { count } = await supabase
          .from('ratings')
          .select('id', { count: 'exact', head: true })
          .eq('listing_id', c.listing?.id ?? '')
          .eq('reviewer_id', user.id)
        if ((count ?? 0) > 0) setRatingDone(true)
      }

      const { data: msgs } = await supabase
        .from('messages')
        .select('id, content, sender_id, created_at, is_read')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })

      if (!mounted) return
      setMessages((msgs as Msg[]) ?? [])
      setLoading(false)

      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', convId)
        .neq('sender_id', user.id)
      if (mounted) window.dispatchEvent(new Event('unread-refresh'))

      channel = supabase
        .channel(`conv-${convId}-${Date.now()}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'messages',
          filter: `conversation_id=eq.${convId}`,
        }, (payload) => {
          if (!mounted) return
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new as Msg]
          })
          if (payload.new.sender_id !== user.id) {
            supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id)
            window.dispatchEvent(new Event('unread-refresh'))
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'conversations',
          filter: `id=eq.${convId}`,
        }, (payload) => {
          if (!mounted) return
          setDealAgreedBuyer(payload.new.deal_agreed_buyer)
          setDealAgreedSeller(payload.new.deal_agreed_seller)
        })
        .subscribe()
    }

    init()
    return () => { mounted = false; if (channel) supabase.removeChannel(channel) }
  }, [convId, router])

  async function agreeToDeal() {
    if (!userId || !conv) return
    setAgreeLoading(true)
    const isBuyer = userId === conv.buyer_id
    const field = isBuyer ? 'deal_agreed_buyer' : 'deal_agreed_seller'
    const supabase = createClient()
    await supabase.from('conversations').update({ [field]: true }).eq('id', convId)
    if (isBuyer) setDealAgreedBuyer(true)
    else setDealAgreedSeller(true)
    setAgreeLoading(false)
  }

  async function submitRating() {
    if (!userId || !conv || ratingLoading) return
    setRatingLoading(true)
    const supabase = createClient()
    // Satıcının store ID'sini bul
    const { data: store } = await supabase
      .from('stores').select('id').eq('user_id', conv.seller_id).single()
    if (store) {
      await supabase.from('ratings').insert({
        listing_id: conv.listing?.id ?? null,
        reviewer_id: userId,
        seller_store_id: store.id,
        stars,
        comment: comment.trim() || null,
      })
    }
    setRatingDone(true)
    setRatingOpen(false)
    setRatingLoading(false)
  }

  async function sendMessage() {
    if (!input.trim() || !userId || sending) return
    const content = input.trim()
    setInput('')
    setSending(true)
    inputRef.current?.focus()
    const supabase = createClient()
    await supabase.from('messages').insert({ conversation_id: convId, sender_id: userId, content })
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const other = conv?.buyer?.id === userId ? conv?.seller : conv?.buyer
  const isBuyer = userId === conv?.buyer_id
  const listingTitle = conv?.listing?.custom_title ?? conv?.listing?.product?.name ?? 'İlan'
  const thumb = conv?.listing?.photos?.[0] ?? conv?.listing?.product?.image_url ?? null
  const myAgreed = isBuyer ? dealAgreedBuyer : dealAgreedSeller
  const otherAgreed = isBuyer ? dealAgreedSeller : dealAgreedBuyer
  const dealConfirmed = dealAgreedBuyer && dealAgreedSeller

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex-1 p-4 space-y-3 animate-pulse">
          {[1,2,3].map(i => (
            <div key={i} className={`h-10 w-48 rounded-2xl bg-gray-100 ${i % 2 === 0 ? 'ml-auto' : ''}`} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto px-0 sm:px-4">

      {/* Üst bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
        <Link href="/mesajlar" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="h-9 w-7 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="h-full w-full object-contain" />
          ) : (
            <Store className="h-4 w-4 text-gray-300 m-auto mt-2" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">@{other?.username ?? '—'}</p>
          {conv?.listing && (
            <Link href={`/ilan/${conv.listing.id}`} className="text-xs text-gray-400 hover:text-primary truncate block">
              {listingTitle}
            </Link>
          )}
        </div>
      </div>

      {/* Ödeme uyarısı */}
      <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-center">
        <p className="text-[11px] text-amber-700 leading-snug">
          Poketopu ödeme veya kargo güvencesi sunmaz. Tüm işlemler kullanıcılar arasında gerçekleşir.
        </p>
      </div>

      {/* Anlaşma paneli */}
      {!dealConfirmed ? (
        <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500 leading-snug">
            {myAgreed
              ? <span className="text-emerald-600 font-medium">Senin onayın alındı — karşı taraf bekleniyor.</span>
              : otherAgreed
              ? <span className="text-blue-600 font-medium">Karşı taraf anlaşmayı onayladı! Sıra sende.</span>
              : 'İşlem tamamlandı mı? Her iki taraf onaylarsa değerlendirme açılır.'}
          </div>
          {!myAgreed && (
            <button
              onClick={agreeToDeal}
              disabled={agreeLoading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors whitespace-nowrap flex-shrink-0 disabled:opacity-50"
            >
              <HandshakeIcon className="h-3.5 w-3.5" />
              Anlaşmaya vardık
            </button>
          )}
        </div>
      ) : (
        <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            Anlaşma her iki tarafça onaylandı.
          </div>
          {isBuyer && !ratingDone && (
            <button
              onClick={() => setRatingOpen(v => !v)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors whitespace-nowrap flex-shrink-0"
            >
              Değerlendir
            </button>
          )}
          {isBuyer && ratingDone && (
            <span className="text-xs text-emerald-600 flex-shrink-0">Değerlendirdin ✓</span>
          )}
        </div>
      )}

      {/* Değerlendirme formu (inline) */}
      {ratingOpen && !ratingDone && (
        <div className="px-4 py-4 bg-white border-b border-gray-100 space-y-3">
          <p className="text-sm font-semibold text-gray-900">@{other?.username} için değerlendirme</p>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setStars(s)}>
                <Star className={`h-7 w-7 transition-colors ${s <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Yorum ekle (isteğe bağlı)..."
            rows={2}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
          />
          <div className="flex gap-2">
            <button
              onClick={submitRating}
              disabled={ratingLoading}
              className="flex-1 h-9 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              {ratingLoading ? 'Gönderiliyor...' : 'Gönder'}
            </button>
            <button
              onClick={() => setRatingOpen(false)}
              className="h-9 px-4 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Mesajlar */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center pt-12">
            <p className="text-sm text-gray-400">Henüz mesaj yok. İlk mesajı sen gönder.</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isOwn = msg.sender_id === userId
          const prevMsg = messages[idx - 1]
          const showTime = !prevMsg || (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) > 5 * 60 * 1000
          return (
            <div key={msg.id}>
              {showTime && (
                <p className="text-center text-[11px] text-gray-400 my-3">
                  {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}
                  {new Date(msg.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                </p>
              )}
              <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  isOwn ? 'bg-primary text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mesaj gönder */}
      <div className="border-t border-gray-100 bg-white px-4 py-3 flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Mesaj yaz..."
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:bg-white transition-colors max-h-32"
          style={{ fieldSizing: 'content' } as React.CSSProperties}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-primary/90 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
