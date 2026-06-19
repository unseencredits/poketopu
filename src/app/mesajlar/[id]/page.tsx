'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Send, Store } from 'lucide-react'
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
  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback((smooth = false) => {
    const el = messagesRef.current
    if (!el) return
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    } else {
      el.scrollTop = el.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let mounted = true

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return
      if (!user) { router.push('/giris'); return }
      setUserId(user.id)

      // Konuşma bilgisi
      const { data: convData } = await supabase
        .from('conversations')
        .select(`
          id,
          listing:listings(id, custom_title, photos, product:products(name, image_url)),
          buyer:profiles!conversations_buyer_id_fkey(id, username),
          seller:profiles!conversations_seller_id_fkey(id, username)
        `)
        .eq('id', convId)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .single()

      if (!mounted) return
      if (!convData) { router.push('/mesajlar'); return }
      setConv(convData as unknown as ConvInfo)

      // Mesajları yükle
      const { data: msgs } = await supabase
        .from('messages')
        .select('id, content, sender_id, created_at, is_read')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })

      if (!mounted) return
      setMessages((msgs as Msg[]) ?? [])
      setLoading(false)

      // Okunmamışları okundu yap ve Header'ı bilgilendir
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', convId)
        .neq('sender_id', user.id)
      if (mounted) window.dispatchEvent(new Event('unread-refresh'))

      if (!mounted) return

      // Gerçek zamanlı mesaj dinle
      channel = supabase
        .channel(`conv-${convId}-${Date.now()}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${convId}`,
        }, (payload) => {
          if (!mounted) return
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new as Msg]
          })
          // Gelen mesajı okundu yap
          if (payload.new.sender_id !== user.id) {
            supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id)
            window.dispatchEvent(new Event('unread-refresh'))
          }
        })
        .subscribe()
    }

    init()
    return () => {
      mounted = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [convId, router])

  async function sendMessage() {
    if (!input.trim() || !userId || sending) return
    const content = input.trim()
    setInput('')
    setSending(true)
    inputRef.current?.focus()

    const supabase = createClient()
    await supabase.from('messages').insert({
      conversation_id: convId,
      sender_id: userId,
      content,
    })
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const other = conv?.buyer?.id === userId ? conv?.seller : conv?.buyer
  const listingTitle = conv?.listing?.custom_title ?? conv?.listing?.product?.name ?? 'İlan'
  const thumb = conv?.listing?.photos?.[0] ?? conv?.listing?.product?.image_url ?? null

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

        {/* İlan küçük resim */}
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
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    isOwn
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
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
