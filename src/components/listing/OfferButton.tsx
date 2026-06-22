'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tag, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'

interface Props {
  listingId: string
  sellerId: string
  listingPrice: number
  compact?: boolean
}

export default function OfferButton({ listingId, sellerId, listingPrice, compact }: Props) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (!isOpen) {
      setError(null)
    }
  }

  async function submit() {
    const val = parseFloat(amount)
    if (!val || val <= 0) { setError('Geçerli bir tutar gir.'); return }
    if (val >= listingPrice) { setError(`Teklif, ilan fiyatından (${listingPrice.toLocaleString('tr-TR')} ₺) düşük olmalı.`); return }
    setSending(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Teklif vermek için giriş yapman gerekiyor.'); setSending(false); return }
    if (user.id === sellerId) { setError('Kendi ilanına teklif veremezsin.'); setSending(false); return }

    const { data: existing } = await supabase
      .from('offers')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) { setError('Bu ilan için zaten bekleyen bir teklifin var.'); setSending(false); return }

    const { error: insertErr } = await supabase.from('offers').insert({
      listing_id: listingId,
      buyer_id: user.id,
      amount: val,
      message: message.trim() || null,
    })

    if (insertErr) { setError('Teklif gönderilemedi. Tekrar dene.'); setSending(false); return }

    setSent(true)
    setSending(false)
    setOpen(false)
  }

  if (sent) {
    return (
      <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Teklif gönderildi
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <button className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors">
            <Tag className="h-3.5 w-3.5" />
            {!compact && 'Teklif Ver'}
            {compact && 'Teklif'}
          </button>
        }
      />

      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-gray-100 gap-1">
          <DialogTitle className="text-base font-bold text-gray-900">Teklif Ver</DialogTitle>
          <p className="text-xs text-gray-500">
            İlan fiyatı: <span className="font-semibold text-gray-800">{listingPrice.toLocaleString('tr-TR')} ₺</span>
          </p>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4">
          {/* Tutar */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
              Teklifin
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={`${Math.floor(listingPrice * 0.9).toLocaleString('tr-TR')}`}
                className="w-full h-11 pl-4 pr-10 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:border-primary transition-colors"
                autoFocus
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">₺</span>
            </div>
            {amount && parseFloat(amount) > 0 && parseFloat(amount) < listingPrice && (
              <p className="text-xs text-emerald-600 mt-1.5">
                %{Math.round((1 - parseFloat(amount) / listingPrice) * 100)} indirim
              </p>
            )}
          </div>

          {/* Mesaj */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
              Mesaj <span className="normal-case font-normal text-gray-400">(isteğe bağlı)</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Teklifini açıkla veya satıcıya bir not bırak..."
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white text-sm px-4 py-2.5 focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Hata */}
          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Aksiyonlar */}
        <div className="flex gap-2.5 px-5 pb-5">
          <DialogClose
            render={
              <button className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                İptal
              </button>
            }
          />
          <button
            onClick={submit}
            disabled={sending || !amount || parseFloat(amount) <= 0}
            className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            {sending ? 'Gönderiliyor...' : 'Teklif Gönder'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
