'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search, MessageCircle, User, Plus, Loader2, Menu, X, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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
