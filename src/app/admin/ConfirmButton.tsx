'use client'

import { useState } from 'react'

interface Props {
  action: () => Promise<void>
  confirmMessage: string
  className?: string
  children: React.ReactNode
}

export default function ConfirmButton({ action, confirmMessage, className, children }: Props) {
  const [pending, setPending] = useState(false)

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return
    setPending(true)
    try {
      await action()
    } finally {
      setPending(false)
    }
  }

  return (
    <button onClick={handleClick} disabled={pending} className={className}>
      {pending ? 'İşleniyor...' : children}
    </button>
  )
}
