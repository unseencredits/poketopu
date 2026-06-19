'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface Props {
  listingId: string
  sellerId: string
  compact?: boolean
}

export default function MessageButton({ listingId, sellerId, compact = false }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/giris?redirect=/ilan/${listingId}`)
      return
    }

    if (user.id === sellerId) {
      router.push('/mesajlar')
      return
    }

    // Mevcut konuşma var mı?
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .eq('seller_id', sellerId)
      .single()

    if (existing) {
      router.push(`/mesajlar/${existing.id}`)
      return
    }

    // Yeni konuşma oluştur
    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({ listing_id: listingId, buyer_id: user.id, seller_id: sellerId })
      .select('id')
      .single()

    if (conv) {
      router.push(`/mesajlar/${conv.id}`)
    } else {
      console.error(error)
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <Button
        onClick={handleClick}
        disabled={loading}
        size="sm"
        className="bg-primary hover:bg-primary/90 text-white rounded-lg gap-1.5 text-xs px-3"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageCircle className="h-3.5 w-3.5" />}
        Mesaj
      </Button>
    )
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl gap-2"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <MessageCircle className="h-5 w-5" />
      )}
      Satıcıya Mesaj Gönder
    </Button>
  )
}
