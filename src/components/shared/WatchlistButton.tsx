'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, BellRing, X } from 'lucide-react'

export default function WatchlistButton({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false)
  const [watching, setWatching] = useState(false)
  const [threshold, setThreshold] = useState('')
  const [savedThreshold, setSavedThreshold] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('watchlists')
        .select('price_threshold')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle()

      if (data) {
        setWatching(true)
        setSavedThreshold(data.price_threshold ?? null)
        if (data.price_threshold) setThreshold(String(data.price_threshold))
      }
      setLoading(false)
    }
    check()
  }, [productId])

  async function save() {
    if (!userId) return
    setSaving(true)
    const supabase = createClient()
    const thresholdVal = threshold ? parseFloat(threshold) : null
    await supabase.from('watchlists').upsert(
      { user_id: userId, product_id: productId, price_threshold: thresholdVal },
      { onConflict: 'user_id,product_id' }
    )
    setWatching(true)
    setSavedThreshold(thresholdVal)
    setSaving(false)
    setOpen(false)
  }

  async function remove() {
    if (!userId) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('watchlists').delete().eq('user_id', userId).eq('product_id', productId)
    setWatching(false)
    setSavedThreshold(null)
    setThreshold('')
    setSaving(false)
    setOpen(false)
  }

  if (loading || !userId) return null

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl border text-sm font-medium transition-colors ${
            watching
              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
              : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          {watching ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          {watching
            ? savedThreshold
              ? `Alarm: ${savedThreshold.toLocaleString('tr-TR')} ₺`
              : 'Takip Ediliyor'
            : 'Takip Et'}
        </button>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Fiyat Alarmı</p>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1.5">Hedef fiyat (isteğe bağlı)</p>
            <div className="relative">
              <input
                type="number"
                value={threshold}
                onChange={e => setThreshold(e.target.value)}
                placeholder="örn. 500"
                className="w-full h-9 pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">₺</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              Bu fiyata ulaşan ilan çıktığında profil sayfanda bildirim gösteririz.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 h-9 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            {watching && (
              <button
                onClick={remove}
                disabled={saving}
                className="h-9 px-3 rounded-xl border border-red-100 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                Bırak
              </button>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 h-9 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
