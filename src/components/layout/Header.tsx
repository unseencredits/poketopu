'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, MessageCircle, User, Plus, Loader2, Menu, X, ChevronRight, Bell, Tag, ArrowLeftRight, CheckCircle, XCircle, ArrowRightLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'

// useSearchParams yalnızca burada kullanılıyor — Suspense gerektirir
function DesktopNavLinks() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function isActive(href: string) {
    const [path, qs] = href.split('?')
    if (!qs) return pathname === path || (path !== '/' && pathname.startsWith(path))
    if (pathname !== path) return false
    const params = new URLSearchParams(qs)
    for (const [key, val] of params.entries()) {
      if (searchParams.get(key) !== val) return false
    }
    return true
  }

  return (
    <>
      {NAV_LINKS.map(({ href, label }) => (
        <Link key={href} href={href}
          className={`transition-colors font-medium ${isActive(href) ? 'text-primary' : 'text-gray-500 hover:text-gray-900'}`}
        >
          {label}
        </Link>
      ))}
    </>
  )
}

interface NotifItem {
  id: string
  type: 'offer_received' | 'offer_countered' | 'offer_accepted' | 'offer_rejected' | 'trade_match'
  title: string
  body: string | null
  is_read: boolean
  created_at: string
}

const NOTIF_ICON: Record<string, { icon: React.ReactNode; bg: string }> = {
  offer_received:  { icon: <Tag className="h-4 w-4 text-amber-600" />,        bg: 'bg-amber-50' },
  offer_countered: { icon: <ArrowLeftRight className="h-4 w-4 text-blue-600" />, bg: 'bg-blue-50' },
  offer_accepted:  { icon: <CheckCircle className="h-4 w-4 text-emerald-600" />, bg: 'bg-emerald-50' },
  offer_rejected:  { icon: <XCircle className="h-4 w-4 text-red-500" />,        bg: 'bg-red-50' },
  trade_match:     { icon: <ArrowRightLeft className="h-4 w-4 text-violet-600" />, bg: 'bg-violet-50' },
}

const NAV_LINKS = [
  { href: '/kartlar',             label: 'Kartlar' },
  { href: '/ara?kategori=sealed', label: 'Sealed' },
  { href: '/ara?kategori=graded', label: 'Graded' },
  { href: '/ara?kategori=accessory', label: 'Aksesuar' },
  { href: '/takas',               label: 'Takas' },
  { href: '/etkinlikler',         label: 'Etkinlikler' },
]

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [unread, setUnread] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [notifs, setNotifs] = useState<NotifItem[]>([])
  const [notifUnread, setNotifUnread] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const currentUidRef = useRef<string | null>(null)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Auth state — giriş/çıkış takibi
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Mesaj okunmamış sayısı ──────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()

    async function loadUnread(uid: string) {
      const { data: convs } = await supabase
        .from('conversations').select('id')
        .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
      const convIds = (convs ?? []).map((c: { id: string }) => c.id)
      if (!convIds.length) { setUnread(0); return }
      const { count } = await supabase
        .from('messages').select('*', { count: 'exact', head: true })
        .eq('is_read', false).neq('sender_id', uid).in('conversation_id', convIds)
      setUnread(count ?? 0)
    }

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      loadUnread(user.id)
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

  // ── Bildirimler ─────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function loadNotifs(uid: string) {
      const { data } = await supabase
        .from('notifications')
        .select('id, type, title, body, is_read, created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(10)
      const rows = (data ?? []) as NotifItem[]
      setNotifs(rows)
      setNotifUnread(rows.filter(n => !n.is_read).length)
    }

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      currentUidRef.current = user.id
      await loadNotifs(user.id)

      // Realtime: REPLICA IDENTITY FULL sayesinde user_id filtresi çalışır
      channel = supabase
        .channel(`notifs:${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          const n = payload.new as NotifItem
          setNotifs(prev => [n, ...prev].slice(0, 10))
          setNotifUnread(prev => prev + 1)
        })
        .subscribe()

    }

    let visCleanup: (() => void) | null = null

    async function setup() {
      await init()
      function onVisible() {
        if (document.visibilityState === 'visible' && currentUidRef.current) {
          loadNotifs(currentUidRef.current)
        }
      }
      document.addEventListener('visibilitychange', onVisible)
      visCleanup = () => document.removeEventListener('visibilitychange', onVisible)
    }

    setup()
    return () => {
      visCleanup?.()
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  // Dropdown dışına tıklayınca kapat
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  async function clearNotifs() {
    const uid = currentUidRef.current
    if (!uid) return
    const supabase = createClient()
    await supabase.from('notifications').delete().eq('user_id', uid)
    setNotifs([])
    setNotifUnread(0)
  }

  async function openNotifPanel() {
    const opening = !notifOpen
    setNotifOpen(opening)
    if (opening && notifUnread > 0) {
      // Tüm bildirimleri okundu yap
      setNotifUnread(0)
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
      const uid = currentUidRef.current
      if (uid) {
        const supabase = createClient()
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', uid)
          .eq('is_read', false)
      }
    }
  }

  // ── Arama ──────────────────────────────────────────────────────────────
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
            .from('profiles').select('id').ilike('username', username).maybeSingle()
          if (prof) {
            const { data: st } = await supabase
              .from('stores').select('slug').eq('user_id', prof.id).maybeSingle()
            if (st) { router.push(`/magaza/${st.slug}`); setQuery(''); return }
          }
        }
        router.push(`/ara?q=${encodeURIComponent(q)}`)
        return
      }

      const [{ data: setRows }, { data: seriesRows }] = await Promise.all([
        supabase.from('products').select('set_id, set_name').ilike('set_name', `%${q}%`).limit(5),
        supabase.from('products').select('series').ilike('series', `%${q}%`).not('series', 'is', null).limit(1),
      ])

      const exactSet = setRows?.find(s => s.set_name?.toLowerCase() === q.toLowerCase())
      const setMatch = exactSet ?? setRows?.[0]
      if (setMatch?.set_id) { router.push(`/kartlar?set_id=${encodeURIComponent(setMatch.set_id)}`); setQuery(''); return }
      if (seriesRows?.[0]?.series) { router.push(`/kartlar?seri=${encodeURIComponent(seriesRows[0].series)}`); setQuery(''); return }

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
              <Image src="/logo-colored.svg" alt="poketopu" width={140} height={33} priority className="h-8 w-auto" />
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

              {userId ? (
                <>
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
                      {notifUnread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {notifUnread > 9 ? '9+' : notifUnread}
                        </span>
                      )}
                    </Button>

                    {notifOpen && (
                      <div className="absolute right-0 top-11 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900">Bildirimler</p>
                          <Link href="/profil" onClick={() => setNotifOpen(false)} className="text-xs text-primary hover:underline">
                            Profile git
                          </Link>
                        </div>
                        {notifs.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-gray-400">Bildirim yok</div>
                        ) : (
                          <>
                            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                              {notifs.map(n => {
                                const meta = NOTIF_ICON[n.type] ?? NOTIF_ICON.offer_received
                                return (
                                  <Link
                                    key={n.id}
                                    href="/profil"
                                    onClick={() => setNotifOpen(false)}
                                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-primary/[0.03]' : ''}`}
                                  >
                                    <div className={`h-8 w-8 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                      {meta.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-xs truncate ${!n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                        {n.title}
                                      </p>
                                      {n.body && <p className="text-xs text-gray-500 truncate mt-0.5">{n.body}</p>}
                                      <p className="text-[10px] text-gray-400 mt-0.5">
                                        {new Date(n.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                    {!n.is_read && (
                                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                                    )}
                                  </Link>
                                )
                              })}
                            </div>
                            <div className="px-4 py-2.5 border-t border-gray-50">
                              <button
                                onClick={clearNotifs}
                                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors w-full justify-center py-1"
                              >
                                <Trash2 className="h-3 w-3" />
                                Bildirimleri temizle
                              </button>
                            </div>
                          </>
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
                </>
              ) : (
                <>
                  <Link href="/giris" className="hidden sm:block">
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-gray-600">
                      Giriş Yap
                    </Button>
                  </Link>
                  <Link href="/kayit" className="hidden sm:block">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-lg h-8 text-xs">
                      Üye Ol
                    </Button>
                  </Link>
                  <Link href="/giris" className="sm:hidden">
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                </>
              )}
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
              <Suspense fallback={
                NAV_LINKS.map(({ href, label }) => (
                  <Link key={href} href={href} className="transition-colors font-medium text-gray-500 hover:text-gray-900">{label}</Link>
                ))
              }>
                <DesktopNavLinks />
              </Suspense>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobil slide-in menü */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] sm:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100">
              <Image src="/logo-colored.svg" alt="poketopu" width={120} height={28} className="h-7 w-auto" />
              <button onClick={() => setMobileOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 py-3 overflow-y-auto">
              {NAV_LINKS.map(({ href, label }) => (
                <Link key={href} href={href}
                  className="flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  {label}
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </Link>
              ))}
              <div className="mx-4 my-3 border-t border-gray-100" />
              {userId ? (
                <>
                  <Link href="/profil"
                    className="flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                  >
                    Profilim
                    {notifUnread > 0 && (
                      <span className="h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {notifUnread > 9 ? '9+' : notifUnread}
                      </span>
                    )}
                  </Link>
                  <Link href="/mesajlar"
                    className="flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                  >
                    Mesajlar
                    {unread > 0 && (
                      <span className="h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/giris"
                    className="flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                  >
                    Giriş Yap
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </Link>
                  <Link href="/kayit"
                    className="flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-primary hover:bg-red-50 transition-colors"
                  >
                    Üye Ol
                    <ChevronRight className="h-4 w-4 text-primary/40" />
                  </Link>
                </>
              )}
            </nav>
            <div className="p-4 border-t border-gray-100">
              {userId ? (
                <Link href="/ilan-ver" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl gap-2">
                    <Plus className="h-4 w-4" />
                    İlan Ver
                  </Button>
                </Link>
              ) : (
                <Link href="/giris" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl">
                    Giriş Yap
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
