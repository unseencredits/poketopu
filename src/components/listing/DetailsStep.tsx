'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CONDITIONS, type Condition, type Category } from '@/types'

interface Props {
  category: Category
  onNext: (data: { condition?: Condition; price: number; quantity: number; notes: string }) => void
}

export default function DetailsStep({ category, onNext }: Props) {
  const needsCondition = category === 'card' || category === 'graded'
  const [condition, setCondition] = useState<Condition | null>(needsCondition ? null : null)
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')

  const canSubmit = price && Number(price) > 0 && (!needsCondition || condition)

  function handleSubmit() {
    if (!canSubmit) return
    onNext({
      condition: condition ?? undefined,
      price: Number(price),
      quantity: Number(quantity) || 1,
      notes: notes.trim(),
    })
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Fiyat & Detaylar</h2>
      <p className="text-sm text-gray-500 mb-6">İlan bilgilerini doldur</p>

      <div className="space-y-5">
        {/* Koşul seçimi */}
        {needsCondition && (
          <div className="space-y-2">
            <Label>Kart Koşulu <span className="text-red-500">*</span></Label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.entries(CONDITIONS) as [Condition, typeof CONDITIONS[Condition]][]).map(([code, info]) => (
                <button
                  key={code}
                  onClick={() => setCondition(code)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border text-center transition-all ${
                    condition === code
                      ? 'border-primary bg-red-50 ring-2 ring-primary/20'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <span className={`text-base font-bold condition-${code.toLowerCase()} px-2 py-0.5 rounded-full text-xs`}>
                    {code}
                  </span>
                  <span className="text-[10px] tracking-[-1.5px] text-gray-400">
                    {'★'.repeat(info.stars)}{'☆'.repeat(5 - info.stars)}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium leading-tight">{info.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fiyat */}
        <div className="space-y-1.5">
          <Label>Fiyat (₺) <span className="text-red-500">*</span></Label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₺</span>
            <Input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="0,00"
              min="0"
              step="0.01"
              className="pl-8 h-11"
            />
          </div>
        </div>

        {/* Adet */}
        <div className="space-y-1.5">
          <Label>Adet</Label>
          <Input
            type="number"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            min="1"
            max="999"
            className="h-11 w-24"
          />
        </div>

        {/* Notlar */}
        <div className="space-y-1.5">
          <Label>Notlar <span className="text-gray-400">(isteğe bağlı)</span></Label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Kart hakkında ekstra bilgi, kusurlar, özel durumlar..."
            rows={3}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full h-11 bg-primary text-white rounded-xl font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
        >
          Fotoğraf Ekle
        </button>
      </div>
    </div>
  )
}
