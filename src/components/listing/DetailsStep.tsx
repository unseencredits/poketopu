'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CONDITIONS, type Condition, type Category } from '@/types'

const GRADERS = ['PSA', 'BGS', 'CGC', 'SGC', 'GMA', 'ACE']
const GRADES = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1]

interface RefPrices {
  cmAvg: number | null
  cmTrend: number | null
  tcgMarket: number | null
  tcgVariant: string | null
  updatedAt: string | null
}

interface Props {
  category: Category
  productId?: string
  onNext: (data: {
    condition?: Condition
    grader?: string
    grade?: number
    price: number
    quantity: number
    notes: string
  }) => void
}

export default function DetailsStep({ category, productId, onNext }: Props) {
  const isGraded = category === 'graded'
  const needsCondition = category === 'card'

  const [condition, setCondition] = useState<Condition | null>(null)
  const [grader, setGrader] = useState<string | null>(null)
  const [grade, setGrade] = useState<number | null>(null)
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')
  const [refPrices, setRefPrices] = useState<RefPrices | null>(null)

  useEffect(() => {
    if (!productId) return
    fetch(`https://api.pokemontcg.io/v2/cards/${productId}?select=tcgplayer,cardmarket`)
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (!json?.data) return
        const cm = json.data.cardmarket?.prices
        const tcg = json.data.tcgplayer?.prices
        // TCGPlayer'da en alakalı variant'ı seç (holofoil > normal > ilk variant)
        const tcgEntry = tcg
          ? (tcg.holofoil ?? tcg.normal ?? Object.values(tcg)[0] ?? null) as { market: number } | null
          : null
        const tcgVariant = tcg
          ? (tcg.holofoil ? 'Holofoil' : tcg.normal ? 'Normal' : Object.keys(tcg)[0] ?? null)
          : null
        setRefPrices({
          cmAvg: cm?.averageSellPrice ?? null,
          cmTrend: cm?.trendPrice ?? null,
          tcgMarket: tcgEntry?.market ?? null,
          tcgVariant,
          updatedAt: json.data.cardmarket?.updatedAt ?? json.data.tcgplayer?.updatedAt ?? null,
        })
      })
      .catch(() => {})
  }, [productId])

  const canSubmit = price && Number(price) > 0
    && (!needsCondition || condition)
    && (!isGraded || (grader && grade != null))

  function handleSubmit() {
    if (!canSubmit) return
    onNext({
      condition: condition ?? undefined,
      grader: grader ?? undefined,
      grade: grade ?? undefined,
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

        {/* Kart koşulu (sadece card kategorisinde) */}
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

        {/* Graded — kuruluş + puan */}
        {isGraded && (
          <>
            <div className="space-y-2">
              <Label>Derecelendiren Kuruluş <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-3 gap-2">
                {GRADERS.map(g => (
                  <button
                    key={g}
                    onClick={() => setGrader(g)}
                    className={`py-2.5 rounded-xl border text-sm font-bold transition-all ${
                      grader === g
                        ? 'border-violet-500 bg-violet-50 text-violet-700 ring-2 ring-violet-200'
                        : 'border-gray-100 bg-white text-gray-700 hover:border-gray-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Grade Puanı <span className="text-red-500">*</span></Label>
              <div className="flex flex-wrap gap-1.5">
                {GRADES.map(g => (
                  <button
                    key={g}
                    onClick={() => setGrade(g)}
                    className={`w-12 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      grade === g
                        ? 'border-violet-500 bg-violet-500 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-violet-300'
                    }`}
                  >
                    {g % 1 === 0 ? g.toFixed(0) : g}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Referans Fiyatlar */}
        {refPrices && (refPrices.cmAvg || refPrices.tcgMarket) && (
          <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 space-y-1.5">
            <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">Referans Fiyatlar</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {refPrices.cmAvg != null && (
                <div className="text-sm">
                  <span className="text-gray-500">Cardmarket ort. </span>
                  <span className="font-bold text-gray-900">{refPrices.cmAvg.toFixed(2)} €</span>
                  {refPrices.cmTrend != null && (
                    <span className="text-gray-400 text-xs ml-1">/ trend {refPrices.cmTrend.toFixed(2)} €</span>
                  )}
                </div>
              )}
              {refPrices.tcgMarket != null && (
                <div className="text-sm">
                  <span className="text-gray-500">TCGPlayer {refPrices.tcgVariant} </span>
                  <span className="font-bold text-gray-900">${refPrices.tcgMarket.toFixed(2)}</span>
                </div>
              )}
            </div>
            {refPrices.updatedAt && (
              <p className="text-[10px] text-blue-400">Güncelleme: {refPrices.updatedAt}</p>
            )}
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
            placeholder={isGraded
              ? 'Sertifika numarası, kart adı, özel bilgiler...'
              : 'Kart hakkında ekstra bilgi, kusurlar, özel durumlar...'}
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
