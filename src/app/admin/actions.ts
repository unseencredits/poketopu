'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

// ── İlanlar ──────────────────────────────────────────────────────────────

export async function removeListing(listingId: string) {
  const supabase = await requireAdmin()
  await supabase.from('listings').update({ status: 'deleted' }).eq('id', listingId)
  revalidatePath('/admin')
}

// ── Takas ─────────────────────────────────────────────────────────────────

export async function removeTrade(tradeId: string) {
  const supabase = await requireAdmin()
  await supabase.from('trades').update({ status: 'deleted' }).eq('id', tradeId)
  revalidatePath('/admin')
}

// ── Kullanıcılar ──────────────────────────────────────────────────────────

export async function banUser(userId: string) {
  const supabase = await requireAdmin()
  const { data: store } = await supabase.from('stores').select('id').eq('user_id', userId).single()
  if (store) {
    await supabase.from('listings').update({ status: 'deleted' }).eq('seller_id', store.id)
  }
  revalidatePath('/admin')
}

export async function deleteUser(userId: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { data: store } = await supabase.from('stores').select('id').eq('user_id', userId).single()
  if (store) {
    await supabase.from('listings').update({ status: 'deleted' }).eq('seller_id', store.id)
  }
  await supabase.from('trades').update({ status: 'deleted' }).eq('user_id', userId)
  const admin = createAdminClient()
  await admin.auth.admin.deleteUser(userId)
  revalidatePath('/admin')
}

// ── Etkinlikler ───────────────────────────────────────────────────────────

export async function approveEvent(eventId: string) {
  const supabase = await requireAdmin()
  await supabase.from('events').update({ status: 'active' }).eq('id', eventId)
  revalidatePath('/admin')
}

export async function rejectEvent(eventId: string) {
  const supabase = await requireAdmin()
  await supabase.from('events').update({ status: 'cancelled' }).eq('id', eventId)
  revalidatePath('/admin')
}

export async function deleteEvent(eventId: string) {
  const supabase = await requireAdmin()
  await supabase.from('events').delete().eq('id', eventId)
  revalidatePath('/admin')
}

export async function updateEvent(eventId: string, formData: FormData) {
  const supabase = await requireAdmin()
  const entryFee = formData.get('entry_fee')
  const maxP = formData.get('max_participants')
  await supabase.from('events').update({
    title: String(formData.get('title') ?? '').trim(),
    city: String(formData.get('city') ?? '').trim(),
    location: (formData.get('location') as string)?.trim() || null,
    event_date: String(formData.get('event_date') ?? ''),
    format: String(formData.get('format') ?? ''),
    status: String(formData.get('status') ?? ''),
    entry_fee: entryFee ? parseFloat(String(entryFee)) : null,
    max_participants: maxP ? parseInt(String(maxP)) : null,
    description: (formData.get('description') as string)?.trim() || null,
  }).eq('id', eventId)
  revalidatePath('/admin')
  revalidatePath('/etkinlikler')
}

// ── Partner Mağazalar ─────────────────────────────────────────────────────

export async function approvePartnerStore(storeId: string) {
  const supabase = await requireAdmin()
  await supabase.from('partner_stores').update({ status: 'approved' }).eq('id', storeId)
  revalidatePath('/admin')
  revalidatePath('/magazalar')
}

export async function rejectPartnerStore(storeId: string) {
  const supabase = await requireAdmin()
  await supabase.from('partner_stores').update({ status: 'rejected' }).eq('id', storeId)
  revalidatePath('/admin')
}

export async function deletePartnerStore(storeId: string) {
  const supabase = await requireAdmin()
  await supabase.from('partner_stores').delete().eq('id', storeId)
  revalidatePath('/admin')
  revalidatePath('/magazalar')
}

export async function updatePartnerStore(storeId: string, formData: FormData) {
  const supabase = await requireAdmin()
  await supabase.from('partner_stores').update({
    name: String(formData.get('name') ?? '').trim(),
    city: String(formData.get('city') ?? '').trim(),
    store_type: String(formData.get('store_type') ?? 'retail'),
    status: String(formData.get('status') ?? ''),
    address: (formData.get('address') as string)?.trim() || null,
    website: (formData.get('website') as string)?.trim() || null,
    instagram: (formData.get('instagram') as string)?.trim() || null,
    phone: (formData.get('phone') as string)?.trim() || null,
    email: (formData.get('email') as string)?.trim() || null,
    maps_url: (formData.get('maps_url') as string)?.trim() || null,
    description: (formData.get('description') as string)?.trim() || null,
  }).eq('id', storeId)
  revalidatePath('/admin')
  revalidatePath('/magazalar')
}
