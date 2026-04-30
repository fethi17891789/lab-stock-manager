import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowUpDown, TrendingUp, TrendingDown, RotateCcw, AlertTriangle, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const typeConfig = {
  entry:   { label: 'Entrée',    icon: TrendingUp,    color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  exit:    { label: 'Sortie',    icon: TrendingDown,  color: 'bg-red-50 text-red-700 border-red-200' },
  return:  { label: 'Retour',   icon: RotateCcw,     color: 'bg-blue-50 text-blue-700 border-blue-200' },
  damaged: { label: 'Endommagé', icon: AlertTriangle, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  lost:    { label: 'Perdu',    icon: AlertTriangle,  color: 'bg-gray-100 text-gray-700 border-gray-200' },
}

export default function StockMovements() {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => { fetchMovements() }, [])

  async function fetchMovements() {
    setLoading(true)
    const { data } = await supabase
      .from('stock_movements')
      .select('*, component:component_id(name, code)')
      .order('date', { ascending: false })
      .limit(200)
    setMovements(data || [])
    setLoading(false)
  }

  const filtered = movements.filter(m => {
    const matchSearch = !search ||
      m.component?.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.component?.code?.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || m.type === typeFilter
    return matchSearch && matchType
  })

  const stats = {
    entries: movements.filter(m => m.type === 'entry').reduce((s, m) => s + m.quantity, 0),
    exits: movements.filter(m => m.type === 'exit').reduce((s, m) => s + m.quantity, 0),
    returns: movements.filter(m => m.type === 'return').reduce((s, m) => s + m.quantity, 0),
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 tabular-nums">{stats.entries}</p>
          <p className="text-xs text-gray-500 mt-0.5">Unités entrées</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-red-100 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mb-2">
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-700 tabular-nums">{stats.exits}</p>
          <p className="text-xs text-gray-500 mt-0.5">Unités sorties</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-2">
            <RotateCcw className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700 tabular-nums">{stats.returns}</p>
          <p className="text-xs text-gray-500 mt-0.5">Unités retournées</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Rechercher un composant..." className="pl-9 bg-white" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'entry', 'exit', 'return', 'damaged', 'lost'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                typeFilter === t
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}>
              {t === 'all' ? 'Tous' : typeConfig[t]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-500">Composant</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500">Référence</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500">Type</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 text-center">Quantité</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500">Date</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500">Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(6)].map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-gray-400">
                  <ArrowUpDown className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Aucun mouvement enregistré</p>
                </TableCell>
              </TableRow>
            ) : filtered.map(m => {
              const config = typeConfig[m.type] || typeConfig.entry
              const Icon = config.icon
              return (
                <TableRow key={m.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-800">{m.component?.name || '—'}</TableCell>
                  <TableCell className="font-mono text-xs text-gray-500">{m.component?.code || '—'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${config.color}`}>
                      <Icon className="w-3 h-3" /> {config.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-bold tabular-nums text-gray-700">{m.quantity}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(m.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-xs text-gray-400">{m.note || '—'}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
