'use client'

import { useState, useEffect } from 'react'
import { MessageSquarePlus, X, Send, CheckCircle } from 'lucide-react'
import { submitFeedback } from '@/app/actions/feedback'
import { createClient } from '@/lib/supabase/client'

type State = 'idle' | 'open' | 'sending' | 'done'

export default function FeedbackButton() {
  const [state, setState] = useState<State>('idle')
  const [message, setMessage] = useState('')
  const [credited, setCredited] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
  }, [])

  async function send() {
    if (!message.trim() || state === 'sending') return
    setState('sending')
    setError(null)
    const result = await submitFeedback(message)
    if (!result.ok) {
      setError(result.error ?? 'Gönderilemedi.')
      setState('open')
      return
    }
    setCredited(result.credited)
    setState('done')
  }

  function close() {
    setState('idle')
    setMessage('')
    setError(null)
    setCredited(false)
  }

  if (!isLoggedIn) return null

  if (state === 'idle') {
    return (
      <button
        onClick={() => setState('open')}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 h-11 px-4 rounded-2xl bg-gray-900 text-white text-sm font-medium shadow-lg hover:bg-gray-800 transition-all"
        title="Geri bildirim gönder"
      >
        <MessageSquarePlus className="h-4 w-4" />
        <span className="hidden sm:inline">Geri Bildirim</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div>
          <p className="text-sm font-semibold text-gray-900">Geri Bildirim</p>
          <p className="text-xs text-gray-400">İlk bildirimde 2 öne çıkarma kredisi!</p>
        </div>
        <button onClick={close} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {state === 'done' ? (
        <div className="p-6 text-center">
          <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
          <p className="font-semibold text-gray-900 mb-1">Teşekkürler!</p>
          <p className="text-xs text-gray-500 mb-2">
            Geri bildirimin iletildi. Her görüş platformu iyileştirmemize yardımcı oluyor.
          </p>
          {credited && (
            <p className="text-xs font-medium text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
              2 öne çıkarma kredisi hesabına eklendi!
            </p>
          )}
          <button onClick={close} className="mt-4 text-xs text-gray-400 hover:text-gray-600">Kapat</button>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Bir şey eksik mi? Farklı çalışmasını istediğin bir şey var mı? Yaz bakalım..."
            rows={4}
            className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary resize-none placeholder:text-gray-400"
            disabled={state === 'sending'}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={send}
            disabled={!message.trim() || state === 'sending'}
            className="w-full h-9 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="h-3.5 w-3.5" />
            {state === 'sending' ? 'Gönderiliyor...' : 'Gönder'}
          </button>
        </div>
      )}
    </div>
  )
}
