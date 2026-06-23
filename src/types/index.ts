export type Condition = 'NM' | 'LP' | 'MP' | 'HP' | 'D'
export type Category = 'card' | 'sealed' | 'accessory' | 'graded'
export type ListingStatus = 'active' | 'sold' | 'reserved' | 'deleted' | 'paused'

export const CONDITIONS: Record<Condition, { label: string; stars: number; color: string }> = {
  NM: { label: 'Near Mint', stars: 5, color: 'text-green-600' },
  LP: { label: 'Lightly Played', stars: 4, color: 'text-lime-600' },
  MP: { label: 'Moderately Played', stars: 3, color: 'text-yellow-600' },
  HP: { label: 'Heavily Played', stars: 2, color: 'text-orange-600' },
  D:  { label: 'Damaged', stars: 1, color: 'text-red-600' },
}

export const CATEGORIES: Record<Category, string> = {
  card: 'Kart',
  sealed: 'Sealed Ürün',
  accessory: 'Aksesuar',
  graded: 'Derecelendirilmiş Kart',
}

export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  created_at: string
  feature_credits: number
  phone: string | null
}

export interface Store {
  id: string
  user_id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  is_verified: boolean
  rating: number
  total_sales: number
  created_at: string
  profile?: Profile
}

export interface PokemonCard {
  id: string
  name: string
  set_id: string
  set_name: string
  series: string | null
  number: string | null
  rarity: string | null
  image_url: string | null
  image_url_hires: string | null
  types: string[] | null
  supertype: string | null
  subtypes: string[] | null
  hp: string | null
}

export interface Listing {
  id: string
  seller_id: string
  product_id: string | null
  custom_title: string | null
  custom_description: string | null
  category: Category
  condition: Condition
  condition_stars: number
  price: number
  currency: string
  quantity: number
  photos: string[]
  notes: string | null
  status: ListingStatus
  grader: string | null
  grade: number | null
  sold_to_user_id: string | null
  sold_outside: boolean
  city: string | null
  shipping: 'kargo' | 'elden' | 'her_ikisi' | null
  swap_open: boolean
  featured_until: string | null
  views: number
  created_at: string
  updated_at: string
  store?: Store
  product?: PokemonCard
}

export interface Conversation {
  id: string
  listing_id: string | null
  buyer_id: string
  seller_id: string
  last_message_at: string
  created_at: string
  listing?: Listing
  buyer?: Profile
  seller?: Profile
  last_message?: Message
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: Profile
}

export type TradeType = 'have' | 'want'

export interface Trade {
  id: string
  user_id: string
  type: TradeType
  product_id: string | null
  custom_title: string | null
  condition: Condition | null
  notes: string | null
  photos: string[]
  status: 'active' | 'closed'
  created_at: string
  profile?: Pick<Profile, 'id' | 'username' | 'avatar_url'>
  product?: Pick<PokemonCard, 'id' | 'name' | 'set_name' | 'number' | 'image_url'>
}

export interface UserTradePreview {
  userId: string
  profile: Pick<Profile, 'id' | 'username' | 'avatar_url'>
  cardImages: string[]
  count: number
}
