import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'

// Cookie'siz anon client — public sorgular için unstable_cache içinde güvenle kullanılabilir
function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
}

export const getCachedEvents = unstable_cache(
  async () => {
    const { data } = await publicClient()
      .from('events')
      .select('*, organizer:profiles(username)')
      .eq('status', 'active')
      .order('event_date', { ascending: true })
      .limit(50)
    return data ?? []
  },
  ['events-list'],
  { revalidate: 300, tags: ['events'] }
)

export const getCachedPartnerStores = unstable_cache(
  async () => {
    const { data } = await publicClient()
      .from('partner_stores')
      .select('id, name, description, city, address, phone, website, instagram, store_type, maps_url')
      .eq('status', 'approved')
      .order('city')
    return data ?? []
  },
  ['partner-stores'],
  { revalidate: 600, tags: ['partner-stores'] }
)

export const getCachedFeaturedListings = unstable_cache(
  async () => {
    const now = new Date().toISOString()
    const { data } = await publicClient()
      .from('listings')
      .select('id, custom_title, price, photos, condition, grader, grade, featured_until, category, city, product:products(name, set_name, image_url), store:stores(name, slug)')
      .eq('status', 'active')
      .gt('featured_until', now)
      .order('featured_until', { ascending: false })
      .limit(12)
    return data ?? []
  },
  ['featured-listings'],
  { revalidate: 60, tags: ['listings'] }
)

export const getCachedRecentListings = unstable_cache(
  async () => {
    const { data } = await publicClient()
      .from('listings')
      .select('id, custom_title, price, photos, condition, grader, grade, featured_until, category, city, product:products(name, set_name, image_url), store:stores(name, slug)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(24)
    return data ?? []
  },
  ['recent-listings'],
  { revalidate: 120, tags: ['listings'] }
)
