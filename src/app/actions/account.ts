'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function changeUsername(newUsername: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı.' }

  const trimmed = newUsername.trim().toLowerCase()
  if (!/^[a-z0-9_]{3,20}$/.test(trimmed)) {
    return { error: 'Kullanıcı adı 3-20 karakter, sadece harf, rakam ve alt çizgi içerebilir.' }
  }

  // Yılda 1 kez kontrolü
  const { data: profile } = await supabase
    .from('profiles')
    .select('username_updated_at')
    .eq('id', user.id)
    .single()

  if (profile?.username_updated_at) {
    const lastChange = new Date(profile.username_updated_at)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    if (lastChange > oneYearAgo) {
      const nextAllowed = new Date(lastChange)
      nextAllowed.setFullYear(nextAllowed.getFullYear() + 1)
      const fmt = nextAllowed.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
      return { error: `Kullanıcı adını yılda yalnızca 1 kez değiştirebilirsin. Sonraki değişiklik: ${fmt}` }
    }
  }

  // Benzersizlik kontrolü
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', trimmed)
    .neq('id', user.id)
    .single()

  if (existing) return { error: 'Bu kullanıcı adı zaten kullanılıyor.' }

  const { error } = await supabase
    .from('profiles')
    .update({ username: trimmed, username_updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: 'Güncelleme başarısız.' }
  return { success: true }
}

export async function changePassword(newPassword: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı.' }

  if (newPassword.length < 6) return { error: 'Şifre en az 6 karakter olmalıdır.' }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: 'Şifre güncellenemedi.' }
  return { success: true }
}

export async function changeEmail(newEmail: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı.' }

  const { error } = await supabase.auth.updateUser(
    { email: newEmail },
    { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?redirect_to=/profil?tab=ayarlar` },
  )
  if (error) return { error: 'E-posta güncellenemedi. Bu adres zaten kullanılıyor olabilir.' }
  return { success: true }
}

export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı.' }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return { error: 'Hesap silinemedi. Lütfen tekrar deneyin.' }
  return { success: true }
}
