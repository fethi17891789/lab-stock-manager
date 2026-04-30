import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Zap, Package, MapPin, Hash, AlertTriangle,
  CheckCircle, Layers, ArrowLeftRight, Clock
} from 'lucide-react'

const statusConfig = {
  in_stock:   { label: 'En stock',      color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  in_project: { label: 'En projet',     color: 'bg-blue-50 text-blue-700 border-blue-200' },
  damaged:    { label: 'Endommagé',     color: 'bg-amber-50 text-amber-700 border-amber-200' },
  lost:       { label: 'Perdu',         color: 'bg-red-50 text-red-700 border-red-200' },
}

const policyConfig = {
  fifo: 'FIFO (Premier entré, premier sorti)',
  lifo: 'LIFO (Dernier entré, premier sorti)',
  fefo: 'FEFO (Premier expiré, premier sorti)',
}

export default function ComponentPublic() {
  const { id } = useParams()
  const [comp, setComp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetchComp() {
      const { data, error } = await supabase
        .from('components')
        .select('*, slot_id(id, number, cabinet_id(id, name, laboratory_id(id, name)))')
        .eq('id', id)
        .single()

      if (error || !data) setNotFound(true)
      else setComp(data)
      setLoading(false)
    }
    fetchComp()
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Package className="w-8 h-8 text-gray-400" />
      </div>
      <h1 className="text-xl font-bold text-gray-800">Composant introuvable</h1>
      <p className="text-gray-500 text-sm mt-2">Ce composant n'existe pas ou a été supprimé.</p>
    </div>
  )

  const slot = comp.slot_id
  const cabinet = slot?.cabinet_id
  const lab = cabinet?.laboratory_id
  const isLow = comp.quantity <= comp.safety_stock
  const status = statusConfig[comp.status] || statusConfig.in_stock

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">LabStock</p>
            <p className="text-xs text-gray-400">Fiche composant</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Titre */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{comp.name}</h1>
              <p className="text-sm font-mono text-violet-600 mt-1">{comp.code}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Stock */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`bg-white rounded-2xl border shadow-sm p-4 ${isLow ? 'border-red-200' : 'border-gray-200'}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${isLow ? 'bg-red-50' : 'bg-emerald-50'}`}>
              {isLow
                ? <AlertTriangle className="w-4 h-4 text-red-500" />
                : <CheckCircle className="w-4 h-4 text-emerald-500" />
              }
            </div>
            <p className={`text-3xl font-bold tabular-nums ${isLow ? 'text-red-600' : 'text-emerald-600'}`}>
              {comp.quantity}
            </p>
            <p className="text-xs text-gray-500 mt-1">Quantité en stock</p>
            {isLow && <p className="text-xs text-red-500 font-medium mt-1">⚠ Stock bas !</p>}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-3xl font-bold text-amber-600 tabular-nums">{comp.safety_stock}</p>
            <p className="text-xs text-gray-500 mt-1">Seuil d'alerte</p>
          </div>
        </div>

        {/* Infos détaillées */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">

          {/* Emplacement */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-violet-500" />
              <p className="text-sm font-semibold text-gray-700">Emplacement</p>
            </div>
            {slot ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Laboratoire</span>
                  <span className="font-medium text-gray-800">{lab?.name || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Armoire</span>
                  <span className="font-medium text-gray-800">{cabinet?.name || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tiroir</span>
                  <span className="font-medium text-gray-800">Tiroir {slot.number}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Emplacement non défini</p>
            )}
          </div>

          {/* Référence */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Hash className="w-4 h-4 text-violet-500" />
              <p className="text-sm font-semibold text-gray-700">Référence</p>
            </div>
            <p className="text-sm font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700">
              {comp.code}
            </p>
          </div>

          {/* Politique de stockage */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-violet-500" />
              <p className="text-sm font-semibold text-gray-700">Politique de stockage</p>
            </div>
            <p className="text-sm text-gray-600">
              {policyConfig[comp.storage_policy] || comp.storage_policy || '—'}
            </p>
          </div>

          {/* Catégorie si disponible */}
          {comp.category_id && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <ArrowLeftRight className="w-4 h-4 text-violet-500" />
                <p className="text-sm font-semibold text-gray-700">Catégorie</p>
              </div>
              <p className="text-sm text-gray-600">{comp.category_id}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-4">
          LabStock · Scanné le {new Date().toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  )
}
