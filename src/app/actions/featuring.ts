'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function featureListing(listingId: string): Promise<{ ok: boolean; error?: string; featuredUntil?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum bulunamadı.' }

  // Kredi kontrolü
  const { data: profile } = await supabase
    .from('profiles').select('feature_credits').eq('id', user.id).single()
  if (!profile || profile.feature_credits < 1)
    return { ok: false, error: 'Öne çıkarma krediniz kalmadı.' }

  // İlan bu kullanıcıya ait mi?
  const { data: store } = await supabase
    .from('stores').select('id').eq('user_id', user.id).single()
  if (!store) return { ok: false, error: 'Mağaza bulunamadı.' }

  const { data: listing } = await supabase
    .from('listings').select('id, featured_until').eq('id', listingId).eq('seller_id', store.id).single()
  if (!listing) return { ok: false, error: 'İlan bulunamadı.' }

  // 7 gün ekle (mevcut süre bitmemişse üstüne ekle)
  const base = listing.featured_until && new Date(listing.featured_until) > new Date()
    ? new Date(listing.featured_until)
    : new Date()
  const featuredUntil = new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Transaction: kredi düş + featured_until güncelle
  await Promise.all([
    supabase.from('profiles').update({ feature_credits: profile.feature_credits - 1 }).eq('id', user.id),
    supabase.from('listings').update({ featured_until: featuredUntil.toISOString() }).eq('id', listingId),
  ])

  revalidatePath('/profil')
  revalidatePath('/')
  revalidatePath('/ara')
  return { ok: true, featuredUntil: featuredUntil.toISOString() }
}

export async function addFeatureCredits(userId: string, amount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return

  await supabase.rpc('increment_feature_credits', { target_user_id: userId, amount })
  revalidatePath('/admin')
}

export async function setFeatureCredits(userId: string, amount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return

  await supabase.from('profiles').update({ feature_credits: Math.max(0, amount) }).eq('id', userId)
  revalidatePath('/admin')
}
