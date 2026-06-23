'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitPartnerStore(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const payload = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    city: formData.get('city') as string,
    address: formData.get('address') as string || null,
    phone: formData.get('phone') as string || null,
    email: formData.get('email') as string || null,
    website: formData.get('website') as string || null,
    instagram: formData.get('instagram') as string || null,
    maps_url: formData.get('maps_url') as string || null,
    store_type: formData.get('store_type') as string || 'retail',
    submitted_by: user?.id ?? null,
  }

  const { error } = await supabase.from('partner_stores').insert(payload)
  if (error) throw new Error(error.message)
  revalidatePath('/magazalar')
}
