'use client'

import { useState } from 'react'
import { deleteUser } from './actions'

export default function DeleteUserButton({ userId, username }: { userId: string; username: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!confirm(`@${username} hesabını kalıcı olarak silmek istediğinden emin misin? Bu işlem geri alınamaz.`)) return
    setLoading(true)
    try {
      await deleteUser(userId)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-40"
    >
      {loading ? '...' : 'Sil'}
    </button>
  )
}
