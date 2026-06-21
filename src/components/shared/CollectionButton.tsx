'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookMarked, Check, Plus, Minus } from 'lucide-react'
import type { Condition } from '@/types'

const CONDITIONS: { value: Condition; label: string }[] = [
  { value: 'nm', label: 'NM' },
  { value: 'lp', label: 'LP' },
  { value: 'mp', label: 'MP' },
  { value: 'hp', label: 'HP' },
  { value: 'dmg', label: 'DMG' },
]

export default function CollectionButton({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false)
  const [inCollection, setInCollection] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [condition, setCondition] = useState<Condition>('nm')
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
        .from('collections')
        .select('quantity, condition')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle()

      if (data) {
        setInCollection(true)
        setQuantity(data.quantity ?? 1)
        setCondition((data.condition as Condition) ?? 'nm')
      }
      setLoading(false)
    }
    check()
  }, [productId])

  async function save() {
    if (!userId) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('collections').upsert(
      { user_id: userId, product_id: productId, quantity, condition },
      { onConflict: 'user_id,product_id' }
    )
    setInCollection(true)
    setSaving(false)
    setOpen(false)
  }

  async function remove() {
    if (!userId) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('collections').delete().eq('user_id', userId).eq('product_id', productId)
    setInCollection(false)
    setQuantity(1)
    setCondition('nm')
    setSaving(false)
    setOpen(false)
  }

  if (loading || !userId) return null

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl border text-sm font-medium transition-colors ${
            inCollection
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          {inCollection ? <Check className="h-4 w-4" /> : <BookMarked className="h-4 w-4" />}
          {inCollection ? `Koleksiyonumda (${quantity} adet)` : 'Koleksiyonuma Ekle'}
        </button>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-4">
          <p className="text-sm font-semibold text-gray-900">Koleksiyon Bilgisi</p>

          <div>
            <p className="text-xs text-gray-500 mb-2">Adet</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="h-8 w-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="text-lg font-bold text-gray-900 w-6 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="h-8 w-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">Durum</p>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCondition(c.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    condition === c.value
                      ? 'border-primary bg-red-50 text-primary'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 h-9 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            {inCollection && (
              <button
                onClick={remove}
                disabled={saving}
                className="h-9 px-3 rounded-xl border border-red-100 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                Çıkar
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
