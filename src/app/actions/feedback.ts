'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitFeedback(message: string): Promise<{ ok: boolean; credited: boolean; error?: string }> {
  if (!message.trim()) return { ok: false, credited: false, error: 'Mesaj boş olamaz.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, credited: false, error: 'Giriş yapman gerekiyor.' }

  // Daha önce geri bildirim gönderdi mi?
  const { count } = await supabase
    .from('feedbacks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const isFirst = (count ?? 0) === 0

  const { error } = await supabase.from('feedbacks').insert({
    user_id: user.id,
    message: message.trim(),
    credited: isFirst,
  })

  if (error) return { ok: false, credited: false, error: 'Gönderilemedi.' }

  // İlk geri bildirimse 2 kredi ver
  if (isFirst) {
    await supabase.rpc('increment_feature_credits', { target_user_id: user.id, amount: 2 })
  }

  revalidatePath('/admin')
  return { ok: true, credited: isFirst }
}
