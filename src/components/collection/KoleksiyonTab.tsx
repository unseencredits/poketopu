'use client'

import { useState, useEffect, useMemo } from 'react'
import { BookMarked, Plus, Lock, Globe, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { TCGSet } from '@/lib/pokemon-tcg'
import SetManageSheet, { type CollectionItem } from './SetManageSheet'

interface Props {
  userId: string
  initialCollections: CollectionItem[]
  initialVisibility: 'private' | 'public'
}

export default function KoleksiyonTab({ userId, initialCollections, initialVisibility }: Props) {
  const [collections, setCollections] = useState<CollectionItem[]>(initialCollections)
  const [visibility, setVisibility] = useState(initialVisibility)
  const [sets, setSets] = useState<TCGSet[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeSetId, setActiveSetId] = useState<string | null>(null)
  const [activeSetName, setActiveSetName] = useState<string | null>(null)
  const [togglingVisibility, setTogglingVisibility] = useState(false)

  useEffect(() => {
    fetch('/api/tcg/sets')
      .then(r => r.json())
      .then(setSets)
      .catch(() => {})
  }, [])

  // Koleksiyonu sete göre grupla
  const setGroups = useMemo(() => {
    const map = new Map<string, { setId: string; setName: string; items: CollectionItem[] }>()
    for (const item of collections) {
      if (!item.product?.set_id || !item.product.set_name) continue
      const key = item.product.set_id
      if (!map.has(key)) {
        map.set(key, { setId: key, setName: item.product.set_name, items: [] })
      }
      map.get(key)!.items.push(item)
    }
    return Array.from(map.values())
  }, [collections])

  const getSetMeta = (setId: string) => sets.find(s => s.id === setId)

  async function toggleVisibility() {
    const next = visibility === 'private' ? 'public' : 'private'
    setTogglingVisibility(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ collection_visibility: next }).eq('id', userId)
    setVisibility(next)
    setTogglingVisibility(false)
  }

  function openAdd() {
    setActiveSetId(null)
    setActiveSetName(null)
    setSheetOpen(true)
  }

  function openEdit(setId: string, setName: string) {
    setActiveSetId(setId)
    setActiveSetName(setName)
    setSheetOpen(true)
  }

  function handleSave(updatedItems: CollectionItem[]) {
    setCollections(prev => {
      const filtered = prev.filter(c => c.product?.set_id !== activeSetId)
      return [...filtered, ...updatedItems]
    })
  }

  const existingItems = activeSetId
    ? (setGroups.find(g => g.setId === activeSetId)?.items ?? [])
    : []

  return (
    <div className="space-y-3">
      {/* Başlık + gizlilik */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <BookMarked className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <p className="font-semibold text-gray-900 text-sm">Koleksiyonum</p>
            <span className="text-xs text-gray-400">({collections.length} kart)</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleVisibility}
              disabled={togglingVisibility}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors disabled:opacity-50 ${
                visibility === 'public'
                  ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {visibility === 'public'
                ? <Globe className="h-3 w-3" />
                : <Lock className="h-3 w-3" />
              }
              {visibility === 'public' ? 'Herkese Açık' : 'Gizli'}
            </button>
            <Button
              size="sm"
              onClick={openAdd}
              className="bg-primary text-white rounded-lg gap-1 text-xs h-7"
            >
              <Plus className="h-3 w-3" /> Set Ekle
            </Button>
          </div>
        </div>
        {visibility === 'public' && (
          <p className="text-xs text-blue-600 mt-2.5 flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Profiline girenler koleksiyonunu görebilir.
          </p>
        )}
      </div>

      {/* Set listesi */}
      {setGroups.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
          <BookMarked className="h-8 w-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Koleksiyonun boş.</p>
          <button
            onClick={openAdd}
            className="text-sm text-primary hover:underline mt-1 inline-block"
          >
            İlk seti ekle →
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="divide-y divide-gray-50">
            {setGroups.map(group => {
              const meta = getSetMeta(group.setId)
              const total = meta?.total ?? 0
              const pct = total > 0 ? Math.round((group.items.length / total) * 100) : 0
              return (
                <div key={group.setId} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-10 w-14 flex-shrink-0 flex items-center justify-center">
                    {meta?.images.logo ? (
                      <img
                        src={meta.images.logo}
                        alt={group.setName}
                        className="h-10 w-14 object-contain"
                      />
                    ) : (
                      <div className="h-10 w-14 rounded-lg bg-gray-100" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{group.setName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden max-w-[80px]">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-800">{group.items.length}</span>
                        {total > 0 && <span className="text-gray-400"> / {total}</span>}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => openEdit(group.setId, group.setName)}
                    className="p-2 rounded-xl text-gray-400 hover:text-primary hover:bg-gray-50 transition-colors"
                    title="Düzenle"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <SetManageSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        userId={userId}
        preselectedSetId={activeSetId}
        preselectedSetName={activeSetName}
        existingItems={existingItems}
        onSave={handleSave}
      />
    </div>
  )
}
