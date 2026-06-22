'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Plus } from 'lucide-react'

const FORMATS = ['Standard', 'Expanded', 'Legacy', 'Draft', 'Prerelease', 'Casual', 'Diğer']

export default function EtkinlikForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [location, setLocation] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [format, setFormat] = useState('Standard')
  const [maxParticipants, setMaxParticipants] = useState('')
  const [entryFee, setEntryFee] = useState('')
  const [prizeInfo, setPrizeInfo] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !eventDate || !city.trim()) {
      setError('Başlık, şehir ve tarih zorunlu.')
      return
    }
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Giriş yapman gerekiyor.'); setSaving(false); return }

    // Profile ID'yi al
    const { data: prof } = await supabase.from('profiles').select('id').eq('id', user.id).single()
    if (!prof) { setError('Profil bulunamadı.'); setSaving(false); return }

    const { error: insertErr } = await supabase.from('events').insert({
      organizer_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      city: city.trim(),
      location: location.trim() || null,
      event_date: eventDate,
      format,
      max_participants: maxParticipants ? parseInt(maxParticipants) : null,
      entry_fee: entryFee ? parseFloat(entryFee) : null,
      prize_info: prizeInfo.trim() || null,
    })

    if (insertErr) { setError('Etkinlik eklenemedi.'); setSaving(false); return }

    setSaving(false)
    setOpen(false)
    // Formu sıfırla
    setTitle(''); setDescription(''); setCity(''); setLocation('')
    setEventDate(''); setMaxParticipants(''); setEntryFee(''); setPrizeInfo('')
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" /> Etkinlik Ekle
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Yeni Etkinlik</h2>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Başlık *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="örn. İstanbul Pokémon Turnuvası"
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Şehir *</label>
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="İstanbul"
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tarih & Saat *</label>
              <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mekan</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Adres / mekan adı"
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Format</label>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map(f => (
                <button key={f} type="button" onClick={() => setFormat(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    format === f ? 'border-primary bg-red-50 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Maks. Katılımcı</label>
              <input type="number" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} placeholder="32"
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kayıt Ücreti (₺)</label>
              <input type="number" value={entryFee} onChange={e => setEntryFee(e.target.value)} placeholder="Ücretsiz"
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ödül / Açıklama</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Turnuva detayları, kurallar, ödüller..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary resize-none" />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)}
              className="flex-1 h-10 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              İptal
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {saving ? 'Kaydediliyor...' : 'Yayınla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
