'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search, MessageCircle, User, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  const [unread, setUnread] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function loadUnread(uid: string) {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', uid)
        .in('conversation_id',
          supabase.from('conversations').select('id').or(`buyer_id.eq.${uid},seller_id.eq.${uid}`) as any
        )
      setUnread(count ?? 0)
    }

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      loadUnread(user.id)

      // Gerçek zamanlı okunmamış güncelle
      const channel = supabase
        .channel('header-unread')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          loadUnread(user.id)
        })
        .subscribe()

      return () => { channel.unsubscribe() }
    }

    init()
  }, [pathname])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/ara?q=${encodeURIComponent(query.trim())}`)
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Kart adı, set, satıcı ara..."
                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white h-10"
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Kart adı, set, satıcı ara..."
              className="pl-10 bg-gray-50 border-gray-200 h-9"
            />
          </div>
        </form>
      </div>

      {/* Kategori nav */}
      <nav className="border-t border-gray-100 bg-white hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-6 h-10 items-center text-sm">
            <Link href="/ara?kategori=card" className="text-gray-600 hover:text-primary transition-colors font-medium">Kartlar</Link>
            <Link href="/ara?kategori=sealed" className="text-gray-600 hover:text-primary transition-colors">Sealed Ürünler</Link>
            <Link href="/ara?kategori=graded" className="text-gray-600 hover:text-primary transition-colors">Derecelendirilmiş</Link>
            <Link href="/ara?kategori=accessory" className="text-gray-600 hover:text-primary transition-colors">Aksesuar</Link>
            <Link href="/magazalar" className="text-gray-600 hover:text-primary transition-colors">Mağazalar</Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
