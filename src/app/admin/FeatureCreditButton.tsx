'use client'

import { useState } from 'react'
import { addFeatureCredits, setFeatureCredits } from '@/app/actions/featuring'

interface Props {
  userId: string
  currentCredits: number
}

export default function FeatureCreditButton({ userId, currentCredits }: Props) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdd(amount: number) {
    setLoading(true)
    await addFeatureCredits(userId, amount)
    setLoading(false)
    setOpen(false)
  }

  async function handleSet(e: React.FormEvent) {
    e.preventDefault()
    const n = parseInt(value)
    if (isNaN(n) || n < 0) return
    setLoading(true)
    await setFeatureCredits(userId, n)
    setLoading(false)
    setOpen(false)
    setValue('')
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 font-medium"
      >
        {currentCredits} kredi
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {[1, 3, 5].map(n => (
        <button
          key={n}
          onClick={() => handleAdd(n)}
          disabled={loading}
          className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 font-medium"
        >
          +{n}
        </button>
      ))}
      <form onSubmit={handleSet} className="flex gap-1">
        <input
          type="number"
          min="0"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="="
          className="w-12 text-xs px-1.5 py-1 border border-gray-200 rounded-lg text-center"
        />
        <button
          type="submit"
          disabled={loading || value === ''}
          className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          Ayarla
        </button>
      </form>
      <button
        onClick={() => { setOpen(false); setValue('') }}
        className="text-xs px-1.5 py-1 rounded-lg text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>
    </div>
  )
}
