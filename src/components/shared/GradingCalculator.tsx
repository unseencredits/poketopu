'use client'

import { useState } from 'react'
import { Calculator, ChevronDown, ChevronUp } from 'lucide-react'

// PSA/BGS puan çarpanları — gerçek piyasa ortalamaları
const MULTIPLIERS: Record<string, Record<string, number>> = {
  PSA: { '10': 5.0, '9': 2.5, '8': 1.4, '7': 1.0, '6': 0.7 },
  BGS: { '10': 8.0, '9.5': 4.0, '9': 2.2, '8.5': 1.3, '8': 0.9 },
}

const GRADING_COSTS: Record<string, number> = {
  PSA: 120,
  BGS: 180,
}

export default function GradingCalculator({ currentPrice }: { currentPrice: number }) {
  const [open, setOpen] = useState(false)
  const [cardCost, setCardCost] = useState(currentPrice > 0 ? String(currentPrice) : '')
  const [shippingCost, setShippingCost] = useState('250')
  const [gradingService, setGradingService] = useState<'PSA' | 'BGS'>('PSA')

  const card = parseFloat(cardCost) || 0
  const shipping = parseFloat(shippingCost) || 0
  const grading = GRADING_COSTS[gradingService]
  const totalCost = card + shipping + grading

  const grades = MULTIPLIERS[gradingService]
  const results = Object.entries(grades).map(([grade, mult]) => {
    const estimatedValue = card * mult
    const profit = estimatedValue - totalCost
    const roi = totalCost > 0 ? ((profit / totalCost) * 100) : 0
    return { grade, estimatedValue, profit, roi }
  })

  const breakEvenMultiplier = totalCost > 0 && card > 0 ? totalCost / card : null

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Derece Değer Hesaplayıcısı</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">PSA / BGS</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
          {/* Girişler */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Kart Maliyeti</label>
              <div className="relative">
                <input
                  type="number"
                  value={cardCost}
                  onChange={e => setCardCost(e.target.value)}
                  placeholder="0"
                  className="w-full h-9 pl-3 pr-7 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary transition-colors"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₺</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Kargo (gidiş-dönüş)</label>
              <div className="relative">
                <input
                  type="number"
                  value={shippingCost}
                  onChange={e => setShippingCost(e.target.value)}
                  placeholder="250"
                  className="w-full h-9 pl-3 pr-7 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary transition-colors"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₺</span>
              </div>
            </div>
          </div>

          {/* Şirket seçimi */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Derecelendirme Şirketi</label>
            <div className="flex gap-2">
              {(['PSA', 'BGS'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setGradingService(s)}
                  className={`flex-1 h-9 rounded-xl text-sm font-semibold border transition-colors ${
                    gradingService === s
                      ? 'border-primary bg-red-50 text-primary'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {s}
                  <span className="text-xs font-normal ml-1 opacity-60">
                    ~{GRADING_COSTS[s].toLocaleString('tr-TR')}₺
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Toplam maliyet */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              <span>Kart</span> + <span>Kargo</span> + <span>{gradingService} ücreti</span>
            </div>
            <p className="text-sm font-bold text-gray-900">
              Toplam: {totalCost.toLocaleString('tr-TR')} ₺
            </p>
          </div>

          {/* Sonuçlar tablosu */}
          {card > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tahmini Kâr/Zarar</p>
              <div className="space-y-1.5">
                {results.map(({ grade, estimatedValue, profit, roi }) => {
                  const isProfit = profit > 0
                  return (
                    <div key={grade} className={`flex items-center gap-3 p-3 rounded-xl ${isProfit ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        isProfit ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {grade}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">{gradingService} {grade} tahmini değer</p>
                        <p className="text-sm font-bold text-gray-900">{estimatedValue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${isProfit ? 'text-emerald-700' : 'text-red-500'}`}>
                          {isProfit ? '+' : ''}{profit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                        </p>
                        <p className={`text-xs ${isProfit ? 'text-emerald-600' : 'text-red-400'}`}>
                          {roi.toFixed(0)}% ROI
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
              {breakEvenMultiplier && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Başabaş için kart değerinin {breakEvenMultiplier.toFixed(1)}× artması gerekiyor.
                </p>
              )}
            </div>
          )}

          <p className="text-[10px] text-gray-300 text-center leading-relaxed">
            Tahminler piyasa ortalamalarına dayalıdır. Gerçek değerler değişkenlik gösterebilir.
          </p>
        </div>
      )}
    </div>
  )
}
