'use client'

export interface PricePoint {
  date: string
  price: number
}

interface Props {
  data: PricePoint[]
}

export default function PriceHistoryChart({ data }: Props) {
  if (data.length === 0) return null

  const prices = data.map(d => d.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const last = prices[prices.length - 1]
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)

  // Chart boyutları
  const W = 400
  const H = 100
  const PAD = { top: 8, right: 8, bottom: 8, left: 8 }
  const cW = W - PAD.left - PAD.right
  const cH = H - PAD.top - PAD.bottom

  const priceRange = max - min || 1
  const n = data.length

  function x(i: number) {
    return PAD.left + (n === 1 ? cW / 2 : (i / (n - 1)) * cW)
  }

  function y(price: number) {
    return PAD.top + cH - ((price - min) / priceRange) * cH
  }

  const pts = data.map((d, i) => ({ x: x(i), y: y(d.price), ...d }))
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const area = n > 1
    ? `${line} L${pts[n - 1].x},${PAD.top + cH} L${pts[0].x},${PAD.top + cH}Z`
    : ''

  const fmt = (v: number) => v.toLocaleString('tr-TR') + ' ₺'

  return (
    <div>
      {/* İstatistikler */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Son Satış', value: fmt(last), highlight: true },
          { label: 'Ortalama', value: fmt(avg) },
          { label: 'En Düşük', value: fmt(min) },
          { label: 'En Yüksek', value: fmt(max) },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
            <p className={`text-sm font-bold ${highlight ? 'text-primary' : 'text-gray-900'}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Grafik */}
      {n > 1 ? (
        <div className="rounded-xl overflow-hidden bg-gray-50 px-2 py-3">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
            <defs>
              <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </linearGradient>
            </defs>
            {area && <path d={area} fill="url(#pg)" />}
            <path d={line} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke="#ef4444" strokeWidth="1.5" />
            ))}
          </svg>
          <div className="flex justify-between text-[10px] text-gray-400 px-1 mt-1">
            <span>{new Date(data[0].date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
            <span className="text-gray-500 font-medium">{n} satış</span>
            <span>{new Date(data[n - 1].date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center py-2">Grafik için en az 2 satış verisi gerekiyor.</p>
      )}
    </div>
  )
}
