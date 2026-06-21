'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tag, X } from 'lucide-react'

interface Props {
  listingId: string
  sellerId: string
  listingPrice: number
}

export default function OfferButton({ listingId, sellerId, listingPrice }: Props) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    const val = parseFloat(amount)
    if (!val || val <= 0) { setError('Geçerli bir tutar gir.'); return }
    if (val >= listingPrice) { setError('Teklif fiyattan düşük olmalı.'); return }
    setSending(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Giriş yapman gerekiyor.'); setSending(false); return }
    if (user.id === sellerId) { setError('Kendi ilanına teklif veremezsin.'); setSending(false); return }

    // Bekleyen teklif var mı kontrol et
    const { data: existing } = await supabase
      .from('offers')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) { setError('Bu ilan için bekleyen teklifin var.'); setSending(false); return }

    const { error: insertErr } = await supabase.from('offers').insert({
      listing_id: listingId,
      buyer_id: user.id,
      amount: val,
      message: message.trim() || null,
    })

    if (insertErr) { setError('Teklif gönderilemedi.'); setSending(false); return }

    setSent(true)
    setSending(false)
    setOpen(false)
  }

  if (sent) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
        <Tag className="h-3.5 w-3.5" /> Teklif gönderildi
      </div>
    )
  }

  return (
    <>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <Tag className="h-3.5 w-3.5" /> Teklif Ver
        </button>
      ) : (
        <div className="mt-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Teklif Ver</p>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1.5">
              İlan fiyatı: <span className="font-semibold text-gray-800">{listingPrice.toLocaleString('tr-TR')} ₺</span>
            </p>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Teklifin"
                className="w-full h-9 pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">₺</span>
            </div>
          </div>

          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Mesaj (isteğe bağlı)"
            rows={2}
            className="w-full rounded-xl border border-gray-200 bg-white text-sm px-3 py-2 focus:outline-none focus:border-primary transition-colors resize-none"
          />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 h-9 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={submit}
              disabled={sending}
              className="flex-1 h-9 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {sending ? 'Gönderiliyor...' : 'Gönder'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
