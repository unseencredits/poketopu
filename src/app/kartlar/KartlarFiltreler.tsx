'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { CONDITIONS, type Condition } from '@/types/index'
import { Input } from '@/components/ui/input'

const SORT_OPTIONS = [
  { value: 'yeni',       label: 'En Yeni' },
  { value: 'fiyat-asc',  label: 'Fiyat: Düşükten Yükseğe' },
  { value: 'fiyat-desc', label: 'Fiyat: Yüksekten Düşüğe' },
]

const SERIES_ORDER = [
  'Scarlet & Violet', 'Sword & Shield', 'Sun & Moon', 'XY',
  'Black & White', 'HeartGold & SoulSilver', 'Platinum', 'Diamond & Pearl',
  'EX', 'e-Card', 'Neo', 'Gym', 'Base',
]

export interface SetInfo { id: string; name: string; series: string }

interface Props { sets: SetInfo[] }

export default function KartlarFiltreler({ sets }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()

  const update = useCallback((key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else       next.delete(key)
    next.delete('sayfa')
    router.push(`${pathname}?${next.toString()}`)
  }, [params, pathname, router])

  const toggle = useCallback((key: string, value: string) => {
    update(key, params.get(key) === value ? null : value)
  }, [params, update])

  const hasFilters = ['set_id','kondisyon','min','max','sehir','teslimat','sirala'].some(k => params.has(k))

  // Set'leri seriye göre grupla
  const groups: Record<string, SetInfo[]> = {}
  for (const s of sets) {
    const series = SERIES_ORDER.includes(s.series) ? s.series : 'Diğer'
    if (!groups[series]) groups[series] = []
    groups[series].push(s)
  }
  const orderedSeries = [...SERIES_ORDER.filter(s => groups[s]), ...(groups['Diğer'] ? ['Diğer'] : [])]

  return (
    <div className="space-y-6">
      {hasFilters && (
        <button
          onClick={() => router.push(pathname)}
          className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
        >
          <X className="h-3.5 w-3.5" /> Filtreleri Temizle
        </button>
      )}

      {/* Sıralama */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sıralama</p>
        <div className="space-y-1">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update('sirala', opt.value === 'yeni' ? null : opt.value)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                (params.get('sirala') ?? 'yeni') === opt.value
                  ? 'bg-red-50 text-primary font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Set */}
      {sets.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Set</p>
          <div className="relative">
            <select
              value={params.get('set_id') ?? ''}
              onChange={e => update('set_id', e.target.value || null)}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 pr-8 text-sm text-gray-700 focus:outline-none focus:border-primary focus:bg-white appearance-none transition-colors"
            >
              <option value="">Tüm setler</option>
              {orderedSeries.map(series => (
                <optgroup key={series} label={series}>
                  {(groups[series] ?? []).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Koşul */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Koşul</p>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(CONDITIONS) as Condition[]).map(code => (
            <button
              key={code}
              onClick={() => toggle('kondisyon', code)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                params.get('kondisyon') === code
                  ? `condition-${code.toLowerCase()} ring-2 ring-offset-1 ring-current`
                  : `condition-${code.toLowerCase()} opacity-60 hover:opacity-100`
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Teslimat */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Teslimat</p>
        <div className="space-y-1">
          {[{ value: 'kargo', label: 'Kargo ile' }, { value: 'elden', label: 'Elden teslim' }].map(opt => (
            <button
              key={opt.value}
              onClick={() => toggle('teslimat', opt.value)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                params.get('teslimat') === opt.value
                  ? 'bg-red-50 text-primary font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Şehir */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Şehir</p>
        <Input
          type="text"
          placeholder="İstanbul, Ankara..."
          defaultValue={params.get('sehir') ?? ''}
          onBlur={e => update('sehir', e.target.value || null)}
          className="h-9"
        />
      </div>

      {/* Fiyat */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fiyat (₺)</p>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            placeholder="Min"
            defaultValue={params.get('min') ?? ''}
            onBlur={e => update('min', e.target.value || null)}
            className="h-9"
          />
          <span className="text-gray-300 text-sm">—</span>
          <Input
            type="number"
            placeholder="Max"
            defaultValue={params.get('max') ?? ''}
            onBlur={e => update('max', e.target.value || null)}
            className="h-9"
          />
        </div>
      </div>
    </div>
  )
}
