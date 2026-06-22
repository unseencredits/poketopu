'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search, MessageCircle, User, Plus, Loader2, Menu, X, ChevronRight, Bell, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NotifItem {
  id: string
  amount: number
  created_at: string
  listingTitle: string
  buyerUsername: string
}

const NAV_LINKS = [
  { href: '/kartlar',            label: 'Kartlar' },
  { href: '/ara?kategori=sealed', label: 'Sealed' },
  { href: '/ara?kategori=graded', label: 'Graded' },
  { href: '/ara?kategori=accessory', label: 'Aksesuar' },
  { href: '/takas',              label: 'Takas' },
  { href: '/turnuva',            label: 'Turnuva' },
]

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [unread, setUnread] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifs, setNotifs] = useState<NotifItem[]>([])
  const [notifNew, setNotifNew] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const supabase = createClient()

    async function loadUnread(uid: string) {
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

    async function loadNotifs(uid: string) {
      const { data: storeRow } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle()
      if (!storeRow) return

      const { data: listingIds } = await supabase
        .from('listings')
        .select('id')
        .eq('store_id', storeRow.id)
      const ids = (listingIds ?? []).map((l: { id: string }) => l.id)
      if (!ids.length) return

      const { data: rows } = await supabase
        .from('offers')
        .select('id, amount, created_at, listing:listings(custom_title, product:products(name)), buyer:profiles(username)')
        .in('listing_id', ids)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(6)

      const items: NotifItem[] = (rows ?? []).map((r) => {
        const row = r as unknown as {
          id: string; amount: number; created_at: string;
          listing: { custom_title: string | null; product: { name: string } | null } | null;
          buyer: { username: string } | null;
        }
        return {
          id: row.id,
          amount: row.amount,
          created_at: row.created_at,
          listingTitle: row.listing?.custom_title ?? row.listing?.product?.name ?? 'İlan',
          buyerUsername: row.buyer?.username ?? '?',
        }
      })
      setNotifs(items)

      const seenAt = parseInt(localStorage.getItem('notif_seen') || '0')
      const newCount = items.filter(i => new Date(i.created_at).getTime() > seenAt).length
      setNotifNew(newCount)
    }

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      loadUnread(user.id)
      loadNotifs(user.id)
    }

    init()
  }, [pathname])

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function openNotifPanel() {
    setNotifOpen(v => !v)
    if (!notifOpen) {
      const now = Date.now()
      localStorage.setItem('notif_seen', String(now))
      setNotifNew(0)
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return

    setSearching(true)
    setMobileOpen(false)
    try {
      const supabase = createClient()

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
        router.push(`/ara?q=${encodeURIComponent(q)}`)
        return
      }

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

      router.push(`/ara?q=${encodeURIComponent(q)}`)
      setQuery('')
    } finally {
      setSearching(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 h-14">

            {/* Hamburger — sadece mobil */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="sm:hidden flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors text-gray-600"
              aria-label="Menü"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <span className="text-xl font-bold text-primary tracking-tight">poketopu</span>
            </Link>

            {/* Arama — orta */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden sm:flex">
              <div className="relative w-full">
                {searching
                  ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                  : <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                }
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Kart adı, set adı veya @satıcı ara..."
                  className="pl-10 bg-gray-50 border-gray-200 focus:bg-white h-9"
                  disabled={searching}
                />
              </div>
            </form>

            {/* Sağ aksiyonlar */}
            <div className="flex items-center gap-1 ml-auto">
              <Link href="/ilan-ver" className="hidden sm:block">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white gap-1.5 rounded-lg h-8 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  İlan Ver
                </Button>
              </Link>

              {/* Bildirim bell */}
              <div className="relative" ref={notifRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9"
                  onClick={openNotifPanel}
                  aria-label="Bildirimler"
                >
                  <Bell className="h-5 w-5" />
                  {notifNew > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {notifNew > 9 ? '9+' : notifNew}
                    </span>
                  )}
                </Button>

                {notifOpen && (
                  <div className="absolute right-0 top-11 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">Bekleyen Teklifler</p>
                      <Link href="/profil" onClick={() => setNotifOpen(false)} className="text-xs text-primary hover:underline">
                        Tümünü gör
                      </Link>
                    </div>
                    {notifs.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-400">Bekleyen teklif yok</div>
                    ) : (
                      <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                        {notifs.map(n => (
                          <Link
                            key={n.id}
                            href="/profil"
                            onClick={() => setNotifOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                              <Tag className="h-4 w-4 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">{n.listingTitle}</p>
                              <p className="text-xs text-gray-500">
                                @{n.buyerUsername} — <span className="font-semibold text-gray-700">{n.amount.toLocaleString('tr-TR')} ₺</span>
                              </p>
                            </div>
                            <span className="text-[10px] text-gray-400 flex-shrink-0">
                              {new Date(n.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Link href="/mesajlar">
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <MessageCircle className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Button>
              </Link>

              <Link href="/profil">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobil arama */}
          <form onSubmit={handleSearch} className="pb-2.5 sm:hidden">
            <div className="relative">
              {searching
                ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                : <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              }
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Kart ara..."
                className="pl-10 bg-gray-50 border-gray-200 h-9"
                disabled={searching}
              />
            </div>
          </form>
        </div>

        {/* Masaüstü kategori nav */}
        <nav className="border-t border-gray-100 bg-white hidden sm:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex gap-5 h-9 items-center text-sm">
              {NAV_LINKS.map(({ href, label }) => {
                const isActive = pathname === href || (href !== '/' && pathname.startsWith(href.split('?')[0]))
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`transition-colors font-medium ${
                      isActive
                        ? 'text-primary'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>
      </header>

      {/* Mobil slide-in menü */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute top-0 left-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100">
              <span className="text-lg font-bold text-primary">poketopu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Nav linkleri */}
            <nav className="flex-1 py-3 overflow-y-auto">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  {label}
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </Link>
              ))}

              <div className="mx-4 my-3 border-t border-gray-100" />

              <Link
                href="/profil"
                className="flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
              >
                Profilim
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </Link>
              <Link
                href="/mesajlar"
                className="flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
              >
                Mesajlar
                {unread > 0 && (
                  <span className="h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
            </nav>

            {/* İlan ver butonu */}
            <div className="p-4 border-t border-gray-100">
              <Link href="/ilan-ver" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl gap-2">
                  <Plus className="h-4 w-4" />
                  İlan Ver
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
