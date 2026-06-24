'use client'

import { useState } from 'react'
import { Loader2, DatabaseZap, CheckCircle2, AlertCircle } from 'lucide-react'

type Status = 'idle' | 'loading' | 'done' | 'error'

interface Result {
  sets: number
  cards: number
  upserted: number
  failed: number
}

export default function ImportCardsButton() {
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleImport() {
    setStatus('loading')
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/import-cards')
      const data = await res.json()
      if (res.ok && data.success) {
        setResult(data)
        setStatus('done')
      } else {
        setError(data.error ?? 'Bilinmeyen hata')
        setStatus('error')
      }
    } catch (e) {
      setError(String(e))
      setStatus('error')
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Kart Veritabanı İçe Aktarma</h3>
        <p className="text-xs text-gray-500 mt-1">
          GitHub'daki PokemonTCG/pokemon-tcg-data reposundan tüm kartları Supabase'e upsert eder.
          Yeni set çıktığında tekrar çalıştırılabilir — mevcut verileri bozmaz.
          Yaklaşık 20–40 saniye sürer.
        </p>
      </div>

      <button
        onClick={handleImport}
        disabled={status === 'loading'}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            İçe aktarılıyor… (20–40 sn)
          </>
        ) : (
          <>
            <DatabaseZap className="h-4 w-4" />
            Kart Verilerini İçe Aktar
          </>
        )}
      </button>

      {status === 'done' && result && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-emerald-700">
            <p className="font-medium">Başarılı</p>
            <p className="text-xs mt-0.5">
              {result.sets} set · {result.cards.toLocaleString('tr-TR')} kart işlendi ·{' '}
              {result.upserted.toLocaleString('tr-TR')} upsert
              {result.failed > 0 && ` · ${result.failed} hata`}
            </p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-sm">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-red-700">
            <p className="font-medium">Hata</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}
