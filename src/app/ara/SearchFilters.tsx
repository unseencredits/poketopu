'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { X } from 'lucide-react'
import { CATEGORIES, CONDITIONS, type Category, type Condition } from '@/types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const SORT_OPTIONS = [
  { value: 'yeni', label: 'En Yeni' },
  { value: 'fiyat-asc', label: 'Fiyat: Düşükten Yükseğe' },
  { value: 'fiyat-desc', label: 'Fiyat: Yüksekten Düşüğe' },
]

export default function SearchFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const update = useCallback((key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('sayfa')
    router.push(`${pathname}?${next.toString()}`)
  }, [params, pathname, router])

  const toggle = useCallback((key: string, value: string) => {
    update(key, params.get(key) === value ? null : value)
  }, [params, update])

  const hasFilters = ['kategori','kondisyon','min','max'].some(k => params.has(k))

  return (
    <div className="space-y-6">
      {/* Aktif filtre temizle */}
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

      {/* Kategori */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Kategori</p>
        <div className="space-y-1">
          {(Object.entries(CATEGORIES) as [Category, string][]).map(([cat, label]) => (
            <button
              key={cat}
              onClick={() => toggle('kategori', cat)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                params.get('kategori') === cat
                  ? 'bg-red-50 text-primary font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Koşul */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Koşul</p>
        <div className="flex flex-wrap gap-1.5">
          {(Object.entries(CONDITIONS) as [Condition, typeof CONDITIONS[Condition]][]).map(([code, info]) => (
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

      {/* Fiyat */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fiyat (₺)</p>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            placeholder="Min"
            defaultValue={params.get('min') ?? ''}
            onBlur={e => update('min', e.target.value || null)}
            className="h-9 text-sm"
          />
          <span className="text-gray-300 text-sm">—</span>
          <Input
            type="number"
            placeholder="Max"
            defaultValue={params.get('max') ?? ''}
            onBlur={e => update('max', e.target.value || null)}
            className="h-9 text-sm"
          />
        </div>
      </div>
    </div>
  )
}
