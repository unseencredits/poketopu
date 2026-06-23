'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  User, Store, Package, LogOut, ChevronRight, Plus,
  Pencil, Eye, EyeOff, Trash2, ImagePlus, X, Upload,
  Banknote, ShoppingBag, AlertCircle, Star, ArrowRightLeft, BookMarked, Bell, BellRing, Tag,
  CheckCircle, MessageCircle, RefreshCw, Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/compress-image'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Profile, Store as StoreType, Listing, ListingStatus, Trade } from '@/types'

import { featureListing } from '@/app/actions/featuring'

interface OfferItem {
  id: string
  amount: number
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'countered'
  message: string | null
  counter_amount: number | null
  counter_message: string | null
  created_at: string
  listing: {
    id: string
    price: number
    custom_title: string | null
    product?: { name: string; image_url: string | null } | null
    store?: { user_id: string } | null
  } | null
  buyer: { id: string; username: string } | null
  isMine: boolean
}

interface TradeMatch {
  id: string
  product_id: string | null
  user_id: string
  product: { id: string; name: string; image_url: string | null } | null
  profile: { id: string; username: string; avatar_url: string | null } | null
}

interface WatchlistItem {
  id: string
  price_threshold: number | null
  created_at: string
  product: { id: string; name: string; set_name: string | null; image_url: string | null } | null
  currentLowest?: number | null
}

interface CollectionItem {
  id: string
  quantity: number
  condition: string | null
  created_at: string
  product: { id: string; name: string; set_name: string | null; image_url: string | null; number: string | null } | null
}

interface Purchase {
  id: string
  listing_id: string
  quantity: number
  sold_outside: boolean
  disclaimed: boolean
  created_at: string
  listing: {
    id: string
    custom_title: string | null
    price: number
    photos: string[]
    seller_id: string
    product?: { name: string; image_url: string | null }
  } | null
}

const MAX_PHOTOS = 4

const RATING_TAGS = [
  'Zamanında kargo',
  'Orijinal ürün',
  'Uygun fiyat',
  'Dürüst satıcı',
  'İyi paketleme',
  'Hızlı iletişim',
]

export default function ProfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [store, setStore] = useState<StoreType | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [myTrades, setMyTrades] = useState<Trade[]>([])
  const [myCollections, setMyCollections] = useState<CollectionItem[]>([])
  const [myWatchlist, setMyWatchlist] = useState<WatchlistItem[]>([])
  const [tradeMatches, setTradeMatches] = useState<TradeMatch[]>([])
  const [offers, setOffers] = useState<OfferItem[]>([])

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editPhotos, setEditPhotos] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Satıldı modal state
  const [soldModalId, setSoldModalId] = useState<string | null>(null)
  const [soldBuyers, setSoldBuyers] = useState<Profile[]>([])
  const [soldBuyersLoading, setSoldBuyersLoading] = useState(false)
  const [soldOutside, setSoldOutside] = useState(false)
  const [selectedBuyerId, setSelectedBuyerId] = useState<string | null>(null)
  const [soldQty, setSoldQty] = useState(1)
  const [markingSold, setMarkingSold] = useState(false)
  const [featuringId, setFeaturingId] = useState<string | null>(null)

  // Satın almadım
  const [disclaimId, setDisclaimId] = useState<string | null>(null)

  // Puanlama state
  const [ratedListingIds, setRatedListingIds] = useState<Set<string>>(new Set())
  const [ratingId, setRatingId] = useState<string | null>(null)
  const [ratingStars, setRatingStars] = useState(0)
  const [ratingTags, setRatingTags] = useState<string[]>([])
  const [ratingComment, setRatingComment] = useState('')
  const [ratingHover, setRatingHover] = useState(0)
  const [submittingRating, setSubmittingRating] = useState(false)

  // Karşı teklif state
  const [counterOfferId, setCounterOfferId] = useState<string | null>(null)
  const [counterAmount, setCounterAmount] = useState('')
  const [counterMessage, setCounterMessage] = useState('')
  const [submittingCounter, setSubmittingCounter] = useState(false)

  // Sekme görülme zamanları (smart badges için)
  const [tabSeen, setTabSeen] = useState<Record<string, number>>({})

  useEffect(() => {
    const stored: Record<string, number> = {}
    for (const tab of ['ilanlarim', 'alimlarim', 'takaslarim', 'koleksiyon', 'teklifler']) {
      stored[tab] = parseInt(localStorage.getItem(`tab_seen_${tab}`) || '0')
    }
    setTabSeen(stored)
  }, [])

  function handleTabChange(value: string) {
    const now = Date.now()
    localStorage.setItem(`tab_seen_${value}`, String(now))
    setTabSeen(prev => ({ ...prev, [value]: now }))
  }

  function countNew(items: Array<{ created_at: string }>, tabKey: string) {
    const seenAt = tabSeen[tabKey] ?? 0
    if (seenAt === 0) return 0
    return items.filter(i => new Date(i.created_at).getTime() > seenAt).length
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/giris'); return }
      setUserId(user.id)

      const [{ data: prof }, { data: st }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('stores').select('*').eq('user_id', user.id).single(),
      ])

      setProfile(prof)
      setStore(st)

      if (st) {
        const { data: myListings } = await supabase
          .from('listings')
          .select('*, product:products(id,name,set_name,image_url)')
          .eq('seller_id', st.id)
          .neq('status', 'deleted')
          .order('created_at', { ascending: false })
          .limit(50)
        setListings((myListings as unknown as Listing[]) ?? [])
      }

      // Satın aldıklarım — sales tablosundan
      const { data: mySales } = await supabase
        .from('sales')
        .select(`
          id, listing_id, quantity, sold_outside, disclaimed, created_at,
          listing:listings(id, custom_title, price, photos, seller_id, product:products(name, image_url))
        `)
        .eq('buyer_id', user.id)
        .eq('disclaimed', false)
        .order('created_at', { ascending: false })
        .limit(20)
      setPurchases((mySales as unknown as Purchase[]) ?? [])

      // Tekliflerim (verdiğim) + gelen teklifler (kendi ilanlarıma)
      const [{ data: myOffers }, { data: receivedOffers }] = await Promise.all([
        supabase
          .from('offers')
          .select('id, amount, status, message, counter_amount, counter_message, created_at, listing:listings(id, price, custom_title, product:products(name, image_url), store:stores(user_id))')
          .eq('buyer_id', user.id)
          .neq('status', 'withdrawn')
          .order('created_at', { ascending: false })
          .limit(10),

        st ? supabase
          .from('offers')
          .select('id, amount, status, message, counter_amount, counter_message, created_at, listing:listings(id, price, custom_title, product:products(name, image_url)), buyer:profiles(id, username)')
          .in('listing_id',
            await supabase.from('listings').select('id').eq('seller_id', st.id).then(r => (r.data ?? []).map((l: { id: string }) => l.id))
          )
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(10)
          : Promise.resolve({ data: [] }),
      ])

      const allOffers: OfferItem[] = [
        ...(receivedOffers ?? []).map((o: Record<string, unknown>) => ({ ...(o as unknown as OfferItem), isMine: false })),
        ...(myOffers ?? []).map((o: Record<string, unknown>) => ({ ...(o as unknown as OfferItem), isMine: true })),
      ]
      setOffers(allOffers)

      // Takaslarım
      const { data: trades } = await supabase
        .from('trades')
        .select('*, product:products(id,name,set_name,image_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)
      setMyTrades((trades as unknown as Trade[]) ?? [])

      // Takip listem
      const { data: wlData } = await supabase
        .from('watchlists')
        .select('id, price_threshold, created_at, product:products(id,name,set_name,image_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)

      if (wlData && wlData.length > 0) {
        const typedWl = (wlData as unknown as WatchlistItem[])
        const productIds = typedWl.map(w => w.product?.id).filter(Boolean) as string[]
        const { data: minPrices } = await supabase
          .from('listings')
          .select('product_id, price')
          .in('product_id', productIds)
          .eq('status', 'active')
          .order('price', { ascending: true })

        const lowestByProduct: Record<string, number> = {}
        for (const row of (minPrices ?? []) as { product_id: string; price: number }[]) {
          if (!(row.product_id in lowestByProduct)) lowestByProduct[row.product_id] = row.price
        }

        setMyWatchlist(typedWl.map(w => ({
          ...w,
          currentLowest: w.product?.id ? lowestByProduct[w.product.id] ?? null : null,
        })))
      }

      // Takas eşleştirme: kullanıcının "Arıyorum" ilanlarına uyan "Elimde Mevcut" ilanları
      const { data: wantTrades } = await supabase
        .from('trades')
        .select('product_id, custom_title')
        .eq('user_id', user.id)
        .eq('type', 'want')
        .eq('status', 'active')

      const wantProductIds = (wantTrades ?? [])
        .map((t: { product_id: string | null }) => t.product_id)
        .filter(Boolean) as string[]

      if (wantProductIds.length > 0) {
        const { data: matchingHaves } = await supabase
          .from('trades')
          .select('id, product_id, user_id, product:products(id,name,image_url), profile:profiles(id,username,avatar_url)')
          .eq('type', 'have')
          .eq('status', 'active')
          .in('product_id', wantProductIds)
          .neq('user_id', user.id)
          .limit(10)

        setTradeMatches((matchingHaves ?? []) as unknown as TradeMatch[])
      }

      // Koleksiyonum
      const { data: colData } = await supabase
        .from('collections')
        .select('id, quantity, condition, created_at, product:products(id,name,set_name,image_url,number)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      setMyCollections((colData ?? []) as unknown as CollectionItem[])

      // Daha önce verilmiş puanlar
      const { data: myRatings } = await supabase
        .from('ratings')
        .select('listing_id')
        .eq('reviewer_id', user.id)
      setRatedListingIds(new Set(myRatings?.map(r => r.listing_id) ?? []))

      setLoading(false)
    }
    load()
  }, [router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  async function findOrCreateConversation(listingId: string, buyerId: string, sellerUserId: string) {
    const supabase = createClient()
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerUserId)
      .maybeSingle()
    if (existing) return existing.id
    const { data: created } = await supabase
      .from('conversations')
      .insert({ listing_id: listingId, buyer_id: buyerId, seller_id: sellerUserId })
      .select('id')
      .single()
    return created?.id ?? null
  }

  async function acceptOffer(offer: OfferItem) {
    const supabase = createClient()
    await supabase.from('offers').update({ status: 'accepted' }).eq('id', offer.id)
    setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, status: 'accepted' } : o))
  }

  async function rejectOffer(offerId: string) {
    const supabase = createClient()
    await supabase.from('offers').update({ status: 'rejected' }).eq('id', offerId)
    setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'rejected' } : o))
  }

  async function handleMessagingAfterAccept(offer: OfferItem) {
    if (!userId || !offer.listing) return
    const buyerId = offer.isMine ? userId : (offer.buyer?.id ?? '')
    const sellerUserId = offer.isMine
      ? (offer.listing.store?.user_id ?? '')
      : userId
    if (!buyerId || !sellerUserId) return
    const convId = await findOrCreateConversation(offer.listing.id, buyerId, sellerUserId)
    if (convId) router.push(`/mesajlar/${convId}`)
  }

  async function submitCounter(offerId: string) {
    const val = parseFloat(counterAmount)
    const offer = offers.find(o => o.id === offerId)
    if (!val || val <= 0 || !offer) return
    setSubmittingCounter(true)
    const supabase = createClient()
    await supabase.from('offers').update({
      status: 'countered',
      counter_amount: val,
      counter_message: counterMessage.trim() || null,
    }).eq('id', offerId)
    setOffers(prev => prev.map(o => o.id === offerId
      ? { ...o, status: 'countered', counter_amount: val, counter_message: counterMessage.trim() || null }
      : o
    ))
    setCounterOfferId(null)
    setCounterAmount('')
    setCounterMessage('')
    setSubmittingCounter(false)
  }

  // ─── Edit ───────────────────────────────────────────────────────────────────

  function openEdit(listing: Listing) {
    setEditingId(listing.id)
    setEditPrice(String(listing.price))
    setEditNotes(listing.notes ?? '')
    setEditPhotos(listing.photos ?? [])
  }

  async function saveEdit() {
    if (!editingId) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('listings').update({
      price: Number(editPrice),
      notes: editNotes.trim() || null,
      photos: editPhotos,
    }).eq('id', editingId)

    if (!error) {
      setListings(prev => prev.map(l =>
        l.id === editingId
          ? { ...l, price: Number(editPrice), notes: editNotes.trim() || null, photos: editPhotos }
          : l
      ))
      setEditingId(null)
    }
    setSaving(false)
  }

  async function uploadPhoto(files: FileList | null) {
    if (!files || !userId) return
    const remaining = MAX_PHOTOS - editPhotos.length
    const newFiles = Array.from(files).slice(0, remaining)
    if (!newFiles.length) return

    setUploadingPhoto(true)
    const supabase = createClient()
    const uploaded: string[] = []

    for (const file of newFiles) {
      const blob = await compressImage(file)
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      const { data, error } = await supabase.storage.from('listings').upload(path, blob, { contentType: 'image/jpeg' })
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from('listings').getPublicUrl(data.path)
        uploaded.push(publicUrl)
      }
    }

    setEditPhotos(prev => [...prev, ...uploaded].slice(0, MAX_PHOTOS))
    setUploadingPhoto(false)
  }

  // ─── Toggle status ───────────────────────────────────────────────────────────

  async function toggleStatus(listing: Listing) {
    const newStatus = listing.status === 'active' ? 'reserved' : 'active'
    const supabase = createClient()
    const { error } = await supabase.from('listings').update({ status: newStatus }).eq('id', listing.id)
    if (!error) {
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: newStatus as ListingStatus } : l))
    }
  }

  async function refreshListing(listingId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('listings')
      .update({ status: 'active', refreshed_at: new Date().toISOString() })
      .eq('id', listingId)
    if (!error) {
      setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'active' as ListingStatus } : l))
    }
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────

  async function deleteListing(listingId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('listings').update({ status: 'deleted' }).eq('id', listingId)
    if (!error) {
      setListings(prev => prev.filter(l => l.id !== listingId))
      setConfirmDeleteId(null)
    }
  }

  // ─── Satıldı modal ───────────────────────────────────────────────────────────

  async function openSoldModal(listing: Listing) {
    setSoldModalId(listing.id)
    setSoldOutside(false)
    setSelectedBuyerId(null)
    setSoldQty(1)
    setSoldBuyersLoading(true)

    const supabase = createClient()
    const { data: convs } = await supabase
      .from('conversations')
      .select('buyer_id')
      .eq('listing_id', listing.id)

    const buyerIds = [...new Set((convs ?? []).map((c: { buyer_id: string }) => c.buyer_id))]
    let buyers: Profile[] = []

    if (buyerIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', buyerIds)
      buyers = (profs as Profile[]) ?? []
    }

    setSoldBuyers(buyers)
    setSoldBuyersLoading(false)
  }

  async function confirmSold() {
    if (!soldModalId) return
    if (!soldOutside && !selectedBuyerId) return
    const listing = listings.find(l => l.id === soldModalId)
    if (!listing) return
    setMarkingSold(true)
    const supabase = createClient()

    // Her durumda satış kaydı oluştur (kısmi veya tam)
    await supabase.from('sales').insert({
      listing_id: soldModalId,
      seller_store_id: listing.seller_id,
      buyer_id: soldOutside ? null : selectedBuyerId,
      quantity: soldQty,
      sold_outside: soldOutside,
      price: listing.price,
    })

    const remaining = listing.quantity - soldQty

    if (remaining > 0) {
      // Kısmi satış — stoku azalt, ilan yayında kal
      const { error } = await supabase.from('listings')
        .update({ quantity: remaining })
        .eq('id', soldModalId)
      if (!error) {
        setListings(prev => prev.map(l =>
          l.id === soldModalId ? { ...l, quantity: remaining } : l
        ))
        setSoldModalId(null)
      }
    } else {
      // Tüm stok tükendi — satıldı olarak işaretle
      const update: Record<string, unknown> = { status: 'sold', quantity: 0 }
      if (soldOutside) {
        update.sold_outside = true
        update.sold_to_user_id = null
      } else {
        update.sold_to_user_id = selectedBuyerId
        update.sold_outside = false
      }
      const { error } = await supabase.from('listings').update(update).eq('id', soldModalId)
      if (!error) {
        setListings(prev => prev.map(l =>
          l.id === soldModalId
            ? { ...l, status: 'sold' as ListingStatus, quantity: 0, sold_outside: soldOutside, sold_to_user_id: selectedBuyerId }
            : l
        ))
        setSoldModalId(null)
      }
    }
    setMarkingSold(false)
  }

  // ─── Ben satın almadım ───────────────────────────────────────────────────────

  async function disclaimPurchase(saleId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('sales')
      .update({ disclaimed: true })
      .eq('id', saleId)

    if (!error) {
      setPurchases(prev => prev.filter(s => s.id !== saleId))
      setDisclaimId(null)
    }
  }

  // ─── Puanlama ────────────────────────────────────────────────────────────────

  function openRating(listingId: string) {
    setRatingId(listingId)
    setRatingStars(0)
    setRatingTags([])
    setRatingComment('')
    setRatingHover(0)
  }

  function toggleTag(tag: string) {
    setRatingTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  async function submitRating() {
    if (!ratingId || ratingStars === 0 || !userId) return
    const purchase = purchases.find(p => p.listing_id === ratingId)
    if (!purchase?.listing) return

    setSubmittingRating(true)
    const supabase = createClient()

    const { error } = await supabase.from('ratings').insert({
      listing_id: ratingId,
      reviewer_id: userId,
      seller_store_id: purchase.listing.seller_id,
      stars: ratingStars,
      tags: ratingTags,
      comment: ratingComment.trim() || null,
    })

    if (!error) {
      setRatedListingIds(prev => new Set([...prev, ratingId]))
      setRatingId(null)
    }
    setSubmittingRating(false)
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="space-y-3 animate-pulse">
          <div className="h-20 bg-gray-100 rounded-2xl" />
          <div className="h-40 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!profile) return null

  const activeCount = listings.filter(l => l.status === 'active').length
  const soldCount = listings.filter(l => l.status === 'sold' && !l.sold_outside).length
  const pausedCount = listings.filter(l => l.status === 'reserved' || l.status === 'paused').length

  const editingListing = listings.find(l => l.id === editingId)
  const soldModalListing = listings.find(l => l.id === soldModalId)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

      {/* Profil kartı */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <User className="h-6 w-6 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900">{profile.full_name ?? profile.username}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-sm text-gray-500">@{profile.username}</p>
              {store && (
                <Link href={`/magaza/${store.slug}`} className="text-xs text-primary hover:underline flex items-center gap-0.5">
                  <Store className="h-3 w-3" /> Mağaza
                </Link>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-400 hover:text-red-500 gap-1.5 text-xs">
            <LogOut className="h-3.5 w-3.5" />
            Çıkış
          </Button>
        </div>

        {/* Öne çıkarma kredileri */}
        {(profile as Profile).feature_credits > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
            <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
            <span><strong>{(profile as Profile).feature_credits}</strong> öne çıkarma krediniz var — aktif ilanlarınızda <Sparkles className="h-3 w-3 inline" /> butonuna basın.</span>
          </div>
        )}

        {/* İstatistikler — profil kartı içinde */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-50">
          {[
            { label: 'Aktif İlan', value: activeCount },
            { label: 'Beklemede', value: pausedCount },
            { label: 'Satılan', value: soldCount },
            { label: 'Koleksiyon', value: myCollections.length },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sekmeli içerik */}
      <Tabs defaultValue="ilanlarim" onValueChange={handleTabChange}>
        <div className="overflow-x-auto pb-0.5 -mx-1 px-1">
          <TabsList className="inline-flex h-auto p-1 bg-gray-100 rounded-2xl gap-1 min-w-full">
            {(() => {
              const pendingOffers = offers.filter(o => !o.isMine && o.status === 'pending')
              const newOffers = countNew(pendingOffers, 'teklifler')
              const newTrades = 0 // TradeMatch has no created_at

              return [
                { value: 'ilanlarim',  label: 'İlanlarım',  newCount: 0,         totalCount: activeCount },
                { value: 'alimlarim',  label: 'Alımlarım',  newCount: countNew(purchases, 'alimlarim'), totalCount: purchases.length },
                { value: 'takaslarim', label: 'Takas',       newCount: newTrades, totalCount: myTrades.length },
                { value: 'koleksiyon', label: 'Koleksiyon',  newCount: 0,         totalCount: myCollections.length },
                { value: 'teklifler',  label: 'Teklifler',   newCount: newOffers, totalCount: pendingOffers.length },
              ].map(({ value, label, newCount, totalCount }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="relative flex-shrink-0 rounded-xl text-xs font-medium px-3 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-500"
                >
                  <span className="flex items-center gap-1.5">
                    {label}
                    {newCount > 0 ? (
                      <span className="h-4 min-w-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {newCount}
                      </span>
                    ) : totalCount > 0 ? (
                      <span className="h-4 min-w-4 px-0.5 rounded-full bg-gray-400 text-white text-[9px] font-bold flex items-center justify-center">
                        {totalCount}
                      </span>
                    ) : null}
                  </span>
                </TabsTrigger>
              ))
            })()}
          </TabsList>
        </div>

        {/* ── İLANLARIM ── */}
        <TabsContent value="ilanlarim" className="mt-3">
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-400" />
                <p className="font-semibold text-gray-900 text-sm">İlanlarım</p>
                <span className="text-xs text-gray-400">({listings.length})</span>
              </div>
              <Link href="/ilan-ver">
                <Button size="sm" className="bg-primary text-white rounded-lg gap-1 text-xs h-7">
                  <Plus className="h-3 w-3" /> Yeni İlan
                </Button>
              </Link>
            </div>

            {listings.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-400">Henüz ilan vermedin.</p>
                <Link href="/ilan-ver" className="text-sm text-primary hover:underline mt-1 inline-block">
                  İlk ilanını ver →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
            {listings.map(listing => {
              const title = listing.custom_title ?? (listing as Listing & { product?: { name: string } }).product?.name ?? '—'
              const img = listing.photos?.[0] ?? (listing as Listing & { product?: { image_url: string | null } }).product?.image_url
              const isPaused = listing.status === 'reserved'
              const isAutoPaused = listing.status === 'paused'
              const isSold = listing.status === 'sold'
              const isDelConfirm = confirmDeleteId === listing.id

              return (
                <div key={listing.id}>
                  <div className={`flex items-center gap-3 p-4 transition-opacity ${isPaused ? 'opacity-40' : isSold ? 'opacity-60' : ''}`}>
                    <div className="h-12 w-9 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                      {img && <img src={img} alt={title} className="h-full w-full object-contain" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          listing.status === 'active' ? 'bg-green-50 text-green-700' :
                          listing.status === 'sold' ? 'bg-gray-100 text-gray-500' :
                          listing.status === 'reserved' ? 'bg-orange-50 text-orange-600' :
                          listing.status === 'paused' ? 'bg-amber-50 text-amber-700' :
                          'bg-gray-50 text-gray-400'
                        }`}>
                          {listing.status === 'active' ? 'Aktif' :
                           listing.status === 'sold'
                             ? (listing.sold_outside ? 'Satıldı (Dışarıda)' : 'Satıldı')
                             : listing.status === 'reserved' ? 'Yayından Kaldırıldı'
                             : listing.status === 'paused' ? 'Süresi Doldu' : '—'}
                        </span>
                        {listing.quantity > 1 && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full font-medium">
                            {listing.quantity} adet
                          </span>
                        )}
                        <span className="text-sm font-bold text-gray-900">
                          {listing.price.toLocaleString('tr-TR')} ₺
                        </span>
                      </div>
                    </div>

                    {!isSold && (
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {/* Düzenle */}
                        <Sheet open={editingId === listing.id} onOpenChange={open => { if (!open) setEditingId(null) }}>
                          <SheetTrigger render={
                            <button onClick={() => openEdit(listing)} title="Düzenle"
                              className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-primary transition-colors">
                              <Pencil className="h-4 w-4" />
                            </button>
                          } />
                          <SheetContent side="right" className="w-full sm:w-96 p-6 overflow-y-auto">
                            <p className="font-semibold text-gray-900 mb-5">İlanı Düzenle</p>
                            {editingListing && (
                              <div className="space-y-5">
                                <div>
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Fiyat (₺)</label>
                                  <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₺</span>
                                    <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} min="0" step="0.01"
                                      className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Açıklama / Not</label>
                                  <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3}
                                    placeholder="Kart hakkında bilgi, kusurlar..."
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-primary" />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                                    Fotoğraflar ({editPhotos.length}/{MAX_PHOTOS})
                                  </label>
                                  <div className="grid grid-cols-4 gap-2 mb-3">
                                    {editPhotos.map((url, i) => (
                                      <div key={url} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                                        <Image src={url} alt={`Fotoğraf ${i + 1}`} fill sizes="25vw" className="object-cover" />
                                        {i === 0 && <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded font-medium">Kapak</div>}
                                        <button onClick={() => setEditPhotos(prev => prev.filter((_, idx) => idx !== i))}
                                          className="absolute top-1 right-1 h-5 w-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ))}
                                    {editPhotos.length < MAX_PHOTOS && Array.from({ length: MAX_PHOTOS - editPhotos.length }).map((_, i) => (
                                      <div key={`empty-${i}`} onClick={() => photoInputRef.current?.click()}
                                        className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-primary/40 transition-colors">
                                        {i === 0 ? (uploadingPhoto ? <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Upload className="h-4 w-4 text-gray-300" />) : null}
                                      </div>
                                    ))}
                                  </div>
                                  {editPhotos.length < MAX_PHOTOS && (
                                    <button onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}
                                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-gray-200 text-sm text-gray-500 hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40">
                                      <ImagePlus className="h-4 w-4" />
                                      {uploadingPhoto ? 'Yükleniyor...' : 'Fotoğraf Ekle'}
                                    </button>
                                  )}
                                  <input ref={photoInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple className="hidden"
                                    onChange={e => uploadPhoto(e.target.files)} />
                                </div>
                                <Button onClick={saveEdit} disabled={saving || !editPrice || Number(editPrice) <= 0}
                                  className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl">
                                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                                </Button>
                              </div>
                            )}
                          </SheetContent>
                        </Sheet>

                        {/* Satıldı olarak işaretle */}
                        {listing.status === 'active' && (
                          <Sheet open={soldModalId === listing.id} onOpenChange={open => { if (!open) setSoldModalId(null) }}>
                            <SheetTrigger render={
                              <button onClick={() => openSoldModal(listing)} title="Satıldı Olarak İşaretle"
                                className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-emerald-500 transition-colors">
                                <Banknote className="h-4 w-4" />
                              </button>
                            } />
                            <SheetContent side="right" className="w-full sm:w-96 p-6 overflow-y-auto">
                              <p className="font-semibold text-gray-900 mb-1">Satıldı Olarak İşaretle</p>
                              <p className="text-sm text-gray-500 mb-5">
                                {soldModalListing?.custom_title ?? (soldModalListing as (Listing & { product?: { name: string } }) | undefined)?.product?.name ?? ''}
                              </p>
                              {soldBuyersLoading ? (
                                <div className="flex items-center justify-center py-8">
                                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                              ) : (
                                <div className="space-y-5">
                                  {/* Adet seçimi — sadece stokta 1'den fazla varsa */}
                                  {soldModalListing && soldModalListing.quantity > 1 && (
                                    <div>
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Kaç adet sattın?</p>
                                      <div className="flex items-center gap-3">
                                        <button
                                          onClick={() => setSoldQty(q => Math.max(1, q - 1))}
                                          className="h-8 w-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg font-medium"
                                        >−</button>
                                        <span className="text-lg font-bold text-gray-900 min-w-[2rem] text-center">{soldQty}</span>
                                        <button
                                          onClick={() => setSoldQty(q => Math.min(soldModalListing.quantity, q + 1))}
                                          className="h-8 w-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg font-medium"
                                        >+</button>
                                        <span className="text-sm text-gray-400">/ {soldModalListing.quantity} adet</span>
                                      </div>
                                      {soldQty < soldModalListing.quantity && (
                                        <p className="text-xs text-blue-600 mt-2">
                                          {soldModalListing.quantity - soldQty} adet stokta kalacak, ilan yayında kalmaya devam edecek.
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {soldBuyers.length > 0 && !soldOutside && (
                                    <div>
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                        Bu ilanla ilgili mesajlaşılan kullanıcılar
                                      </p>
                                      <div className="space-y-2">
                                        {soldBuyers.map(buyer => (
                                          <button key={buyer.id} onClick={() => setSelectedBuyerId(buyer.id)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                                              selectedBuyerId === buyer.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                            }`}>
                                            <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-500">
                                              {(buyer.full_name ?? buyer.username).charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium text-gray-900">{buyer.full_name ?? buyer.username}</p>
                                              <p className="text-xs text-gray-500">@{buyer.username}</p>
                                            </div>
                                            {selectedBuyerId === buyer.id && (
                                              <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                                <X className="h-3 w-3 text-white rotate-45" />
                                              </div>
                                            )}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {soldBuyers.length === 0 && !soldOutside && (
                                    <div className="text-center py-4 text-sm text-gray-400">
                                      Bu ilanla ilgili mesajlaşan kullanıcı yok.
                                    </div>
                                  )}
                                  <button
                                    onClick={() => { setSoldOutside(v => !v); if (!soldOutside) setSelectedBuyerId(null) }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                                      soldOutside ? 'border-gray-400 bg-gray-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                    }`}>
                                    <div className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                      soldOutside ? 'border-gray-600 bg-gray-600' : 'border-gray-300'
                                    }`}>
                                      {soldOutside && <X className="h-3 w-3 text-white rotate-45" />}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">Poketopu dışında sattım</p>
                                      <p className="text-xs text-gray-400">İlan kapanır ama satış istatistiklerine eklenmez</p>
                                    </div>
                                  </button>
                                  <Button onClick={confirmSold} disabled={markingSold || (!soldOutside && !selectedBuyerId)}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                                    {markingSold ? 'Kaydediliyor...' : 'Satıldı Olarak İşaretle'}
                                  </Button>
                                </div>
                              )}
                            </SheetContent>
                          </Sheet>
                        )}

                        {/* Süresi dolmuş ilan: Yenile */}
                        {isAutoPaused && (
                          <button onClick={() => refreshListing(listing.id)} title="30 Gün Uzat"
                            className="p-2 rounded-xl hover:bg-amber-50 text-amber-500 hover:text-amber-700 transition-colors">
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        )}

                        {/* Yayından kaldır / Aktif et */}
                        {!isAutoPaused && (
                          <button onClick={() => toggleStatus(listing)} title={isPaused ? 'Tekrar Yayınla' : 'Yayından Kaldır'}
                            className={`p-2 rounded-xl hover:bg-gray-50 transition-colors ${isPaused ? 'text-orange-400 hover:text-green-500' : 'text-gray-400 hover:text-orange-500'}`}>
                            {isPaused ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                        )}

                        {/* Öne Çıkar */}
                        {listing.status === 'active' && (
                          <button
                            onClick={async () => {
                              setFeaturingId(listing.id)
                              const res = await featureListing(listing.id)
                              setFeaturingId(null)
                              if (!res.ok) alert(res.error)
                            }}
                            disabled={featuringId === listing.id}
                            title={listing.featured_until && new Date(listing.featured_until) > new Date()
                              ? `Öne çıkıyor — ${new Date(listing.featured_until).toLocaleDateString('tr-TR')}'e kadar`
                              : 'Öne Çıkar (1 kredi)'}
                            className={`p-2 rounded-xl transition-colors ${
                              listing.featured_until && new Date(listing.featured_until) > new Date()
                                ? 'text-amber-500'
                                : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                            }`}>
                            <Sparkles className="h-4 w-4" />
                          </button>
                        )}

                        {/* Sil */}
                        <button onClick={() => setConfirmDeleteId(listing.id)} title="Sil"
                          className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isDelConfirm && (
                    <div className="mx-4 mb-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                      <p className="text-sm text-red-700 flex-1">İlanı kalıcı olarak silmek istediğine emin misin?</p>
                      <button onClick={() => deleteListing(listing.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded-lg bg-red-100 hover:bg-red-200 transition-colors whitespace-nowrap">
                        Evet, Sil
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-gray-500 hover:text-gray-700">İptal</button>
                    </div>
                  )}
                </div>
              )
              })}
            </div>
          )}
        </div>
        </TabsContent>

        {/* ── ALIMLARIM ── */}
        <TabsContent value="alimlarim" className="mt-3">
          {purchases.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
              <ShoppingBag className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Henüz satın alma kaydın yok.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-gray-50">
                <ShoppingBag className="h-4 w-4 text-gray-400" />
                <p className="font-semibold text-gray-900 text-sm">Satın Aldıklarım</p>
                <span className="text-xs text-gray-400">({purchases.length})</span>
              </div>
              <div className="divide-y divide-gray-50">
                {purchases.map(item => {
                  const title = item.listing?.custom_title ?? item.listing?.product?.name ?? '—'
                  const img = item.listing?.photos?.[0] ?? item.listing?.product?.image_url
                  const alreadyRated = ratedListingIds.has(item.listing_id)
                  return (
                    <div key={item.id}>
                      <div className="flex items-center gap-3 p-4">
                        <div className="h-12 w-9 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                          {img && <img src={img} alt={title} className="h-full w-full object-contain" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
                          <p className="text-sm font-bold text-gray-900 mt-0.5">
                            {item.listing?.price.toLocaleString('tr-TR')} ₺
                            {item.quantity > 1 && <span className="text-xs text-gray-400 font-normal ml-1.5">× {item.quantity} adet</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {alreadyRated ? (
                            <span className="text-xs text-yellow-600 font-medium flex items-center gap-1 px-2">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> Puanlandı
                            </span>
                          ) : (
                            <Sheet open={ratingId === item.listing_id} onOpenChange={open => { if (!open) setRatingId(null) }}>
                              <SheetTrigger render={
                                <button onClick={() => openRating(item.listing_id)}
                                  className="flex items-center gap-1 text-xs font-medium text-yellow-600 hover:text-yellow-700 px-2 py-1.5 rounded-xl hover:bg-yellow-50 transition-colors border border-yellow-200">
                                  <Star className="h-3.5 w-3.5" /> Puan Ver
                                </button>
                              } />
                              <SheetContent side="right" className="w-full sm:w-96 p-6 overflow-y-auto">
                                <p className="font-semibold text-gray-900 mb-1">Satıcıyı Puanla</p>
                                <p className="text-sm text-gray-500 mb-6">{title}</p>
                                <div className="space-y-6">
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Genel Puan</p>
                                    <div className="flex items-center gap-2">
                                      {[1,2,3,4,5].map(star => (
                                        <button key={star} onClick={() => setRatingStars(star)}
                                          onMouseEnter={() => setRatingHover(star)} onMouseLeave={() => setRatingHover(0)}
                                          className="transition-transform hover:scale-110">
                                          <Star className={`h-9 w-9 transition-colors ${star <= (ratingHover || ratingStars) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                        </button>
                                      ))}
                                      {ratingStars > 0 && <span className="text-sm text-gray-500 ml-1">{['','Berbat','Kötü','İdare Eder','İyi','Mükemmel'][ratingStars]}</span>}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Öne Çıkan Özellikler <span className="normal-case font-normal">(isteğe bağlı)</span></p>
                                    <div className="flex flex-wrap gap-2">
                                      {RATING_TAGS.map(tag => (
                                        <button key={tag} onClick={() => toggleTag(tag)}
                                          className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${ratingTags.includes(tag) ? 'bg-yellow-50 border-yellow-400 text-yellow-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                          {ratingTags.includes(tag) && '✓ '}{tag}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Yorum <span className="normal-case font-normal">(isteğe bağlı)</span></p>
                                    <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)} rows={3} maxLength={300}
                                      placeholder="Deneyimini paylaş..."
                                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-primary" />
                                    <p className="text-xs text-gray-400 text-right mt-1">{ratingComment.length}/300</p>
                                  </div>
                                  <Button onClick={submitRating} disabled={submittingRating || ratingStars === 0}
                                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl">
                                    {submittingRating ? 'Gönderiliyor...' : 'Puanı Gönder'}
                                  </Button>
                                </div>
                              </SheetContent>
                            </Sheet>
                          )}
                          <button onClick={() => setDisclaimId(item.id)} title="Ben satın almadım"
                            className="p-2 rounded-xl hover:bg-gray-50 text-gray-300 hover:text-red-400 transition-colors">
                            <AlertCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {disclaimId === item.id && (
                        <div className="mx-4 mb-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
                          <p className="text-sm text-amber-800 flex-1">Bu ürünü satın almadın mı?</p>
                          <button onClick={() => disclaimPurchase(item.id)}
                            className="text-xs font-semibold text-amber-700 px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 transition-colors whitespace-nowrap">
                            Evet, Satın Almadım
                          </button>
                          <button onClick={() => setDisclaimId(null)} className="text-xs text-gray-500">İptal</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── TAKASLARIM ── */}
        <TabsContent value="takaslarim" className="mt-3 space-y-3">
          {/* Takas Eşleşmeleri */}
          {tradeMatches.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-emerald-100">
                <ArrowRightLeft className="h-4 w-4 text-emerald-600" />
                <p className="font-semibold text-emerald-800 text-sm">Takas Eşleşmeleri</p>
                <span className="ml-auto text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-medium">{tradeMatches.length} yeni</span>
              </div>
              <p className="text-xs text-emerald-700 px-4 pt-3 pb-1">Aradığın kartları elinde bulunduran kullanıcılar:</p>
              <div className="divide-y divide-emerald-100">
                {tradeMatches.map(match => (
                  <Link key={match.id} href={`/takas/${match.profile?.username}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-100/50 transition-colors">
                    <div className="h-10 w-7 rounded-lg overflow-hidden bg-white flex-shrink-0">
                      {match.product?.image_url && <img src={match.product.image_url} alt={match.product.name} className="h-full w-full object-contain" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-900 truncate">{match.product?.name}</p>
                      <p className="text-xs text-emerald-600">@{match.profile?.username} elinde mevcut</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Takaslarım */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-gray-400" />
                <p className="font-semibold text-gray-900 text-sm">Takaslarım</p>
                <span className="text-xs text-gray-400">({myTrades.length})</span>
              </div>
              <Link href="/takas-ver">
                <Button size="sm" variant="outline" className="rounded-lg text-xs gap-1 h-7">
                  <Plus className="h-3 w-3" /> Ekle
                </Button>
              </Link>
            </div>
            {myTrades.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-400">Henüz takas ilanın yok.</p>
                <Link href="/takas-ver" className="text-sm text-primary hover:underline mt-1 inline-block">Takas ilanı ver →</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {myTrades.map(trade => {
                  const title = trade.custom_title ?? trade.product?.name ?? '—'
                  const img = trade.photos?.[0] ?? trade.product?.image_url
                  return (
                    <div key={trade.id} className="flex items-center gap-3 p-4">
                      <div className="h-12 w-9 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                        {img && <img src={img} alt={title} className="h-full w-full object-contain" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${trade.type === 'have' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                            {trade.type === 'have' ? 'Elimde Mevcut' : 'Arıyorum'}
                          </span>
                          {trade.condition && <span className="text-xs text-gray-400">{trade.condition}</span>}
                          {trade.status === 'closed' && <span className="text-xs text-gray-400">· Kapalı</span>}
                        </div>
                      </div>
                      <button onClick={async () => {
                        const supabase = createClient()
                        if (trade.status === 'active') {
                          await supabase.from('trades').update({ status: 'closed' }).eq('id', trade.id)
                          setMyTrades(prev => prev.map(t => t.id === trade.id ? { ...t, status: 'closed' } : t))
                        } else {
                          await supabase.from('trades').update({ status: 'active' }).eq('id', trade.id)
                          setMyTrades(prev => prev.map(t => t.id === trade.id ? { ...t, status: 'active' } : t))
                        }
                      }} className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0">
                        {trade.status === 'active' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button onClick={async () => {
                        const supabase = createClient()
                        await supabase.from('trades').delete().eq('id', trade.id)
                        setMyTrades(prev => prev.filter(t => t.id !== trade.id))
                      }} className="text-xs text-red-400 hover:text-red-600 flex-shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── KOLEKSİYON ── */}
        <TabsContent value="koleksiyon" className="mt-3 space-y-3">
          {/* Koleksiyonum */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-gray-50">
              <BookMarked className="h-4 w-4 text-gray-400" />
              <p className="font-semibold text-gray-900 text-sm">Koleksiyonum</p>
              <span className="text-xs text-gray-400">({myCollections.length} kart)</span>
            </div>
            {myCollections.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-400">Koleksiyonun boş.</p>
                <Link href="/kartlar" className="text-sm text-primary hover:underline mt-1 inline-block">Kart ekle →</Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 p-4">
                {myCollections.map(item => {
                  const name = item.product?.name ?? '—'
                  const img = item.product?.image_url
                  const condLabel = item.condition?.toUpperCase() ?? null
                  return (
                    <div key={item.id} className="relative group">
                      <div className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden" style={{ aspectRatio: '5/7' }}>
                        {img ? <img src={img} alt={name} className="w-full h-full object-contain p-1" /> : <div className="w-full h-full flex items-center justify-center"><div className="w-8 h-12 rounded bg-gray-200" /></div>}
                        {item.quantity > 1 && <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{item.quantity}</span>}
                        {condLabel && <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded text-[10px] font-semibold bg-black/50 text-white">{condLabel}</span>}
                      </div>
                      <p className="text-[10px] text-gray-700 font-medium mt-1 truncate">{name}</p>
                      <button onClick={async () => {
                        const supabase = createClient()
                        await supabase.from('collections').delete().eq('id', item.id)
                        setMyCollections(prev => prev.filter(c => c.id !== item.id))
                      }} className="absolute top-1 left-1 h-5 w-5 rounded-full bg-white/80 text-red-400 items-center justify-center hidden group-hover:flex shadow-sm">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Takip Listem */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-gray-50">
              <Bell className="h-4 w-4 text-gray-400" />
              <p className="font-semibold text-gray-900 text-sm">Fiyat Takibi</p>
              <span className="text-xs text-gray-400">({myWatchlist.length} kart)</span>
            </div>
            {myWatchlist.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-400">Takip listesi boş.</p>
                <p className="text-xs text-gray-400 mt-1">Kart sayfalarından fiyat alarmı ekleyebilirsin.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {myWatchlist.map(item => {
                  const name = item.product?.name ?? '—'
                  const img = item.product?.image_url
                  const alarmed = item.price_threshold != null && item.currentLowest != null && item.currentLowest <= item.price_threshold
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-4">
                      <div className="h-12 w-9 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100">
                        {img && <img src={img} alt={name} className="h-full w-full object-contain" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {item.currentLowest != null && <span className="text-xs text-gray-500">En düşük: <span className="font-semibold text-gray-800">{item.currentLowest.toLocaleString('tr-TR')} ₺</span></span>}
                          {item.price_threshold != null && (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${alarmed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                              {alarmed ? <BellRing className="h-2.5 w-2.5" /> : <Bell className="h-2.5 w-2.5" />}
                              Alarm: {item.price_threshold.toLocaleString('tr-TR')} ₺
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={async () => {
                        const supabase = createClient()
                        await supabase.from('watchlists').delete().eq('id', item.id)
                        setMyWatchlist(prev => prev.filter(w => w.id !== item.id))
                      }} className="text-gray-400 hover:text-red-500 flex-shrink-0 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── TEKLİFLER ── */}
        <TabsContent value="teklifler" className="mt-3 space-y-4">
          {offers.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
              <Tag className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Henüz teklif yok.</p>
            </div>
          ) : (() => {
            const received = offers.filter(o => !o.isMine)
            const sent     = offers.filter(o => o.isMine)

            const OfferCard = ({ offer }: { offer: OfferItem }) => {
              const title = offer.listing?.custom_title ?? offer.listing?.product?.name ?? '—'
              const img = offer.listing?.product?.image_url
              const isCountering = counterOfferId === offer.id
              const statusLabel: Record<string, string> = { pending: 'Bekliyor', accepted: 'Kabul Edildi', rejected: 'Reddedildi', withdrawn: 'Geri Çekildi', countered: 'Karşı Teklif' }
              const statusColor: Record<string, string> = {
                pending:   'bg-amber-50 text-amber-700 border-amber-200',
                accepted:  'bg-emerald-50 text-emerald-700 border-emerald-200',
                rejected:  'bg-red-50 text-red-600 border-red-200',
                withdrawn: 'bg-gray-50 text-gray-500 border-gray-200',
                countered: 'bg-blue-50 text-blue-700 border-blue-200',
              }

              return (
                <div className="border-b border-gray-50 last:border-0">
                  <div className="flex gap-3 p-4">
                    {/* Görsel */}
                    <div className="h-14 w-10 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100">
                      {img && <img src={img} alt={title} className="h-full w-full object-contain" />}
                    </div>

                    {/* İçerik */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 leading-snug">{title}</p>
                        <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor[offer.status] ?? statusColor.pending}`}>
                          {statusLabel[offer.status] ?? offer.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900">{offer.amount.toLocaleString('tr-TR')} ₺</span>
                        {offer.listing?.price && (
                          <span className="text-xs text-gray-400">/ {offer.listing.price.toLocaleString('tr-TR')} ₺ liste fiyatı</span>
                        )}
                      </div>

                      {!offer.isMine && offer.buyer && (
                        <p className="text-xs text-gray-500">@{offer.buyer.username}</p>
                      )}

                      {offer.message && (
                        <p className="text-xs text-gray-500 italic">"{offer.message}"</p>
                      )}

                      {/* Karşı teklif kutusu */}
                      {offer.status === 'countered' && offer.counter_amount && (
                        <div className="mt-1 text-xs text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                          <span className="font-semibold">Karşı teklif:</span>{' '}
                          <span className="font-bold">{offer.counter_amount.toLocaleString('tr-TR')} ₺</span>
                          {offer.counter_message && <span className="text-blue-600 ml-1 block mt-0.5 not-italic">"{offer.counter_message}"</span>}
                        </div>
                      )}

                      {/* Kabul sonrası mesajlaş */}
                      {offer.status === 'accepted' && (
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                          <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="flex-1">Teklif kabul edildi!</span>
                          <button
                            onClick={() => handleMessagingAfterAccept(offer)}
                            className="flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
                          >
                            <MessageCircle className="h-3 w-3" />
                            Mesajlaş
                          </button>
                        </div>
                      )}

                      {/* Aksiyon butonları */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        {/* Satıcı: gelen teklif bekliyor */}
                        {!offer.isMine && offer.status === 'pending' && (
                          <>
                            <button
                              onClick={() => acceptOffer(offer)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold transition-colors"
                            >
                              ✓ Kabul Et
                            </button>
                            <button
                              onClick={() => rejectOffer(offer.id)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 font-semibold transition-colors"
                            >
                              ✕ Reddet
                            </button>
                            <button
                              onClick={() => { setCounterOfferId(isCountering ? null : offer.id); setCounterAmount(''); setCounterMessage('') }}
                              className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium transition-colors"
                            >
                              {isCountering ? 'İptal' : '↩ Karşı Teklif'}
                            </button>
                          </>
                        )}

                        {/* Alıcı: verilen teklif, karşı teklif geldi */}
                        {offer.isMine && offer.status === 'countered' && (
                          <>
                            <button
                              onClick={() => acceptOffer(offer)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold transition-colors"
                            >
                              ✓ Kabul Et
                            </button>
                            <button
                              onClick={() => rejectOffer(offer.id)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 font-semibold transition-colors"
                            >
                              ✕ Reddet
                            </button>
                          </>
                        )}

                        {/* Alıcı: bekleyen teklif → geri çek */}
                        {offer.isMine && offer.status === 'pending' && (
                          <button
                            onClick={async () => {
                              const supabase = createClient()
                              await supabase.from('offers').update({ status: 'withdrawn' }).eq('id', offer.id)
                              setOffers(prev => prev.filter(o => o.id !== offer.id))
                            }}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                          >
                            Geri çek
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Karşı teklif formu — inline expand */}
                  {isCountering && (
                    <div className="mx-4 mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
                      <p className="text-xs font-semibold text-blue-800">Karşı Teklif Gönder</p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            value={counterAmount}
                            onChange={e => setCounterAmount(e.target.value)}
                            placeholder="Tutar (₺)"
                            className="w-full h-9 pl-3 pr-8 rounded-lg border border-blue-200 bg-white text-sm focus:outline-none focus:border-blue-400"
                            autoFocus
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₺</span>
                        </div>
                        <button
                          onClick={() => submitCounter(offer.id)}
                          disabled={submittingCounter || !counterAmount}
                          className="h-9 px-4 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
                        >
                          {submittingCounter ? '...' : 'Gönder'}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={counterMessage}
                        onChange={e => setCounterMessage(e.target.value)}
                        placeholder="Açıklama ekle (isteğe bağlı)"
                        className="w-full h-9 px-3 rounded-lg border border-blue-200 bg-white text-xs focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  )}
                </div>
              )
            }

            return (
              <>
                {received.length > 0 && (
                  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50 bg-gray-50/60">
                      <Tag className="h-3.5 w-3.5 text-gray-400" />
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gelen Teklifler</p>
                      <span className="text-xs text-gray-400 ml-auto">{received.length}</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {received.map(offer => <OfferCard key={offer.id} offer={offer} />)}
                    </div>
                  </div>
                )}

                {sent.length > 0 && (
                  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50 bg-gray-50/60">
                      <Tag className="h-3.5 w-3.5 text-gray-400" />
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Verdiğim Teklifler</p>
                      <span className="text-xs text-gray-400 ml-auto">{sent.length}</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {sent.map(offer => <OfferCard key={offer.id} offer={offer} />)}
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </TabsContent>

      </Tabs>
    </div>
  )
}
