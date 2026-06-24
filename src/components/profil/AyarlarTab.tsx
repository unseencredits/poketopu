'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { changeUsername, changePassword, changeEmail, deleteAccount } from '@/app/actions/account'
import type { Profile } from '@/types'

interface Props {
  profile: Profile & { username_updated_at?: string | null }
}

type SectionKey = 'username' | 'password' | 'email' | 'delete'

function Feedback({ ok, msg }: { ok: boolean; msg: string }) {
  return (
    <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
      {ok
        ? <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        : <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
      }
      {msg}
    </div>
  )
}

export default function AyarlarTab({ profile }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState<SectionKey | null>(null)

  // Username
  const [username, setUsername] = useState(profile.username ?? '')
  const [usernameLoading, setUsernameLoading] = useState(false)
  const [usernameFeedback, setUsernameFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  // Password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordFeedback, setPasswordFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  // Email
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailFeedback, setEmailFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteFeedback, setDeleteFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  function toggle(key: SectionKey) {
    setOpen(prev => prev === key ? null : key)
  }

  async function handleUsername(e: React.FormEvent) {
    e.preventDefault()
    setUsernameLoading(true)
    setUsernameFeedback(null)
    const result = await changeUsername(username)
    setUsernameLoading(false)
    if (result.error) {
      setUsernameFeedback({ ok: false, msg: result.error })
    } else {
      setUsernameFeedback({ ok: true, msg: 'Kullanıcı adın güncellendi.' })
      router.refresh()
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ ok: false, msg: 'Şifreler eşleşmiyor.' })
      return
    }
    setPasswordLoading(true)
    setPasswordFeedback(null)
    const result = await changePassword(newPassword)
    setPasswordLoading(false)
    if (result.error) {
      setPasswordFeedback({ ok: false, msg: result.error })
    } else {
      setPasswordFeedback({ ok: true, msg: 'Şifren güncellendi.' })
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    setEmailLoading(true)
    setEmailFeedback(null)
    const result = await changeEmail(newEmail)
    setEmailLoading(false)
    if (result.error) {
      setEmailFeedback({ ok: false, msg: result.error })
    } else {
      setEmailFeedback({ ok: true, msg: 'Onay e-postası gönderildi. Yeni adresini kontrol et.' })
      setNewEmail('')
    }
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault()
    if (deleteConfirm !== 'HESABIMI SİL') {
      setDeleteFeedback({ ok: false, msg: 'Onay metni hatalı.' })
      return
    }
    setDeleteLoading(true)
    setDeleteFeedback(null)
    const result = await deleteAccount()
    setDeleteLoading(false)
    if (result.error) {
      setDeleteFeedback({ ok: false, msg: result.error })
    } else {
      router.push('/?hesap=silindi')
    }
  }

  const sections: { key: SectionKey; label: string; desc: string }[] = [
    { key: 'username', label: 'Kullanıcı Adı Değiştir', desc: 'Yılda 1 kez değiştirilebilir' },
    { key: 'password', label: 'Şifre Değiştir', desc: 'Yeni bir şifre belirle' },
    { key: 'email',    label: 'E-posta Değiştir', desc: 'Onay e-postası gönderilir' },
    { key: 'delete',   label: 'Hesabı Sil', desc: 'Geri alınamaz' },
  ]

  return (
    <div className="space-y-2">
      {sections.map(({ key, label, desc }) => (
        <div key={key} className={`bg-white border rounded-2xl overflow-hidden ${key === 'delete' ? 'border-red-100' : 'border-gray-100'}`}>
          <button
            onClick={() => toggle(key)}
            className="w-full flex items-center justify-between px-4 py-4 text-left"
          >
            <div>
              <p className={`text-sm font-medium ${key === 'delete' ? 'text-red-600' : 'text-gray-900'}`}>{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            {open === key
              ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
              : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
            }
          </button>

          {open === key && (
            <div className="px-4 pb-4 border-t border-gray-50 pt-4">

              {key === 'username' && (
                <form onSubmit={handleUsername} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Yeni kullanıcı adı</Label>
                    <Input
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="ornek_kullanici"
                      className="h-10"
                      minLength={3}
                      maxLength={20}
                    />
                    <p className="text-xs text-gray-400">3-20 karakter, harf, rakam ve alt çizgi</p>
                  </div>
                  {usernameFeedback && <Feedback {...usernameFeedback} />}
                  <Button type="submit" disabled={usernameLoading} className="h-10 bg-primary text-white hover:bg-primary/90 rounded-xl">
                    {usernameLoading ? 'Kaydediliyor…' : 'Kaydet'}
                  </Button>
                </form>
              )}

              {key === 'password' && (
                <form onSubmit={handlePassword} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Yeni şifre</Label>
                    <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="h-10" minLength={6} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Şifre tekrar</Label>
                    <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className="h-10" required />
                  </div>
                  {passwordFeedback && <Feedback {...passwordFeedback} />}
                  <Button type="submit" disabled={passwordLoading} className="h-10 bg-primary text-white hover:bg-primary/90 rounded-xl">
                    {passwordLoading ? 'Güncelleniyor…' : 'Şifremi Güncelle'}
                  </Button>
                </form>
              )}

              {key === 'email' && (
                <form onSubmit={handleEmail} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Yeni e-posta adresi</Label>
                    <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="yeni@mail.com" className="h-10" required />
                  </div>
                  {emailFeedback && <Feedback {...emailFeedback} />}
                  <Button type="submit" disabled={emailLoading} className="h-10 bg-primary text-white hover:bg-primary/90 rounded-xl">
                    {emailLoading ? 'Gönderiliyor…' : 'Onay Gönder'}
                  </Button>
                </form>
              )}

              {key === 'delete' && (
                <form onSubmit={handleDelete} className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Hesabın silinince tüm ilanların ve koleksiyonun kalıcı olarak kaldırılır.
                    Bu işlem <span className="font-semibold text-red-600">geri alınamaz.</span>
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-red-600">Onaylamak için <span className="font-bold">HESABIMI SİL</span> yaz</Label>
                    <Input
                      value={deleteConfirm}
                      onChange={e => setDeleteConfirm(e.target.value)}
                      placeholder="HESABIMI SİL"
                      className="h-10 border-red-200 focus-visible:ring-red-400"
                    />
                  </div>
                  {deleteFeedback && <Feedback {...deleteFeedback} />}
                  <Button
                    type="submit"
                    disabled={deleteLoading || deleteConfirm !== 'HESABIMI SİL'}
                    className="h-10 bg-red-600 text-white hover:bg-red-700 rounded-xl disabled:opacity-40"
                  >
                    {deleteLoading ? 'Siliniyor…' : 'Hesabımı Kalıcı Olarak Sil'}
                  </Button>
                </form>
              )}

            </div>
          )}
        </div>
      ))}
    </div>
  )
}
