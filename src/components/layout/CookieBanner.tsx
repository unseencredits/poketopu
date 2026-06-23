'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'cookie_consent'

export type ConsentValue = 'accepted' | 'rejected' | null

export function getConsent(): ConsentValue {
  if (typeof window === 'undefined') return null
  return (localStorage.getItem(STORAGE_KEY) as ConsentValue) ?? null
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setVisible(false)
    // Analytics'i aktif etmek için sayfayı yenilemek gerekmez; ConditionalAnalytics zaten okur
    window.dispatchEvent(new Event('cookie-consent-changed'))
  }

  function reject() {
    localStorage.setItem(STORAGE_KEY, 'rejected')
    setVisible(false)
    window.dispatchEvent(new Event('cookie-consent-changed'))
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-3xl mx-auto bg-gray-900 text-white rounded-2xl shadow-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm text-gray-300 leading-relaxed">
          <span className="font-medium text-white">Çerez tercihleriniz</span> — Oturum çerezleri zorunludur.
          Analitik çerezler (Vercel Analytics) sitenin nasıl kullanıldığını anonim olarak ölçer.{' '}
          <Link href="/cerez-politikasi" className="underline text-gray-400 hover:text-white">Detaylar</Link>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={reject}
            className="text-xs px-4 py-2 rounded-xl border border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white transition-colors"
          >
            Sadece Zorunlu
          </button>
          <button
            onClick={accept}
            className="text-xs px-4 py-2 rounded-xl bg-white text-gray-900 font-medium hover:bg-gray-100 transition-colors"
          >
            Kabul Et
          </button>
        </div>
      </div>
    </div>
  )
}
