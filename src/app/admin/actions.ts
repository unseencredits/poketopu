'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) throw new Error('Forbidden')
  return supabase
}

export async function removeListing(listingId: string) {
  const supabase = await requireAdmin()
  await supabase.from('listings').update({ status: 'deleted' }).eq('id', listingId)
  revalidatePath('/admin')
}

export async function banUser(userId: string) {
  const supabase = await requireAdmin()
  // Tüm aktif ilanları kaldır
  await supabase.from('listings')
    .update({ status: 'deleted' })
    .eq('seller_id', (await supabase.from('stores').select('id').eq('user_id', userId).single()).data?.id ?? '')
  revalidatePath('/admin')
}
