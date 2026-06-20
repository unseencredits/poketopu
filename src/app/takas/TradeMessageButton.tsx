'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function TradeMessageButton({ tradeUserId }: { tradeUserId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/giris?redirect=/takas')
      return
    }

    if (user.id === tradeUserId) {
      router.push('/profil')
      return
    }

    // Mevcut konuşma var mı? (iki kullanıcı arasında listing olmayan)
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .is('listing_id', null)
      .eq('buyer_id', user.id)
      .eq('seller_id', tradeUserId)
      .maybeSingle()

    if (existing) {
      router.push(`/mesajlar/${existing.id}`)
      return
    }

    const { data: conv } = await supabase
      .from('conversations')
      .insert({ listing_id: null, buyer_id: user.id, seller_id: tradeUserId })
      .select('id')
      .single()

    if (conv) {
      router.push(`/mesajlar/${conv.id}`)
    } else {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors disabled:opacity-50"
    >
      {loading
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <MessageCircle className="h-3.5 w-3.5" />}
      Mesaj Gönder
    </button>
  )
}
