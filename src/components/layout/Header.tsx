'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search, MessageCircle, User, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [unread, setUnread] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function loadUnread(uid: string) {
      // Önce konuşma ID'lerini al
      const { data: convs } = await supabase
        .from('conversations')
        .select('id')
        .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)

      const convIds = (convs ?? []).map((c: { id: string }) => c.id)
      if (!convIds.length) { setUnread(0); return }

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', uid)
        .in('conversation_id', convIds)

      setUnread(count ?? 0)
    }

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      loadUnread(user.id)

      // Sayfa değiştiğinde yeniden sayılıyor (pathname dep), realtime gerekmez
    }

    init()
  }, [pathname])

  // Mesaj okunduğunda conversation sayfasından event gelir
  // userId beklenmeden kayıt olunur — kullanıcı konuşmadan çıkmadan önce event gelebilir
  useEffect(() => {
    const refresh = () => {
      const supabase = createClient()
      async function recount() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: convs } = await supabase.from('conversations').select('id')
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        const convIds = (convs ?? []).map((c: { id: string }) => c.id)
        if (!convIds.length) { setUnread(0); return }
        const { count } = await supabase.from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false).neq('sender_id', user.id).in('conversation_id', convIds)
        setUnread(count ?? 0)
      }
      recount()
    }
    window.addEventListener('unread-refresh', refresh)
    return () => window.removeEventListener('unread-refresh', refresh)
  }, [])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return

    setSearching(true)
    try {
      const supabase = createClient()

      // @kullaniciadi → satıcı mağazası
      if (q.startsWith('@')) {
        const username = q.slice(1).trim()
        if (username) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('id')
            .ilike('username', username)
            .maybeSingle()

          if (prof) {
            const { data: st } = await supabase
              .from('stores')
              .select('slug')
              .eq('user_id', prof.id)
              .maybeSingle()
            if (st) {
              router.push(`/magaza/${st.slug}`)
              setQuery('')
              return
            }
          }
        }
        // Satıcı bulunamadı — normal aramaya düş
        router.push(`/ara?q=${encodeURIComponent(q)}`)
        return
      }

      // Set adı veya seri adı araması
      const [{ data: setRows }, { data: seriesRows }] = await Promise.all([
        supabase
          .from('products')
          .select('set_id, set_name')
          .ilike('set_name', `%${q}%`)
          .limit(5),
        supabase
          .from('products')
          .select('series')
          .ilike('series', `%${q}%`)
          .not('series', 'is', null)
          .limit(1),
      ])

      // Tam eşleşmeye öncelik ver, yoksa ilk kısmi eşleşme
      const exactSet = setRows?.find(s => s.set_name?.toLowerCase() === q.toLowerCase())
      const setMatch = exactSet ?? setRows?.[0]

      if (setMatch?.set_id) {
        router.push(`/kartlar?set_id=${encodeURIComponent(setMatch.set_id)}`)
        setQuery('')
        return
      }

      if (seriesRows?.[0]?.series) {
        router.push(`/kartlar?seri=${encodeURIComponent(seriesRows[0].series)}`)
        setQuery('')
        return
      }

      // Normal kart / başlık araması
      router.push(`/ara?q=${encodeURIComponent(q)}`)
      setQuery('')
    } finally {
      setSearching(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-xl font-bold text-primary tracking-tight">
              poketopu
            </span>
          </Link>

          {/* Arama */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden sm:flex">
            <div className="relative w-full">
              {searching
                ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                : <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              }
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Kart adı, set adı veya @satıcı ara..."
                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white h-10"
                disabled={searching}
              />
            </div>
          </form>

          {/* Sağ aksiyonlar */}
          <div className="flex items-center gap-1 ml-auto">
            <Link href="/ilan-ver">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white hidden sm:flex gap-1.5 rounded-lg">
                <Plus className="h-4 w-4" />
                İlan Ver
              </Button>
            </Link>

            <Link href="/mesajlar">
              <Button variant="ghost" size="icon" className="relative">
                <MessageCircle className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Button>
            </Link>

            <Link href="/profil">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobil arama */}
        <form onSubmit={handleSearch} className="pb-3 sm:hidden">
          <div className="relative">
            {searching
              ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
              : <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            }
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Kart adı, set adı veya @satıcı ara..."
              className="pl-10 bg-gray-50 border-gray-200 h-9"
              disabled={searching}
            />
          </div>
        </form>
      </div>

      {/* Kategori nav */}
      <nav className="border-t border-gray-100 bg-white hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-6 h-10 items-center text-sm">
            <Link href="/kartlar" className="text-gray-600 hover:text-primary transition-colors font-medium">Kartlar</Link>
            <Link href="/ara?kategori=sealed" className="text-gray-600 hover:text-primary transition-colors">Sealed Ürünler</Link>
            <Link href="/ara?kategori=graded" className="text-gray-600 hover:text-primary transition-colors">Derecelendirilmiş</Link>
            <Link href="/ara?kategori=accessory" className="text-gray-600 hover:text-primary transition-colors">Aksesuar</Link>
            <Link href="/ara" className="text-gray-600 hover:text-primary transition-colors">Tüm İlanlar</Link>
            <Link href="/takas" className="text-gray-600 hover:text-primary transition-colors">Takas</Link>
            <Link href="/turnuva" className="text-gray-600 hover:text-primary transition-colors">Turnuva</Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
