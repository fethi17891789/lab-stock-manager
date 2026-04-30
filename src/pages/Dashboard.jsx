import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Package, AlertTriangle, FolderKanban,
  ArrowUpDown, TrendingUp, Clock
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'

const mockStockData = [
  { name: 'Résistances', stock: 450 },
  { name: 'Condensateurs', stock: 230 },
  { name: 'Transistors', stock: 89 },
  { name: 'CI', stock: 45 },
  { name: 'LED', stock: 320 },
  { name: 'Capteurs', stock: 28 },
]

const movementTypeConfig = {
  entry:   { label: 'Entrée',    color: 'text-emerald-600 bg-emerald-50 border border-emerald-200' },
  exit:    { label: 'Sortie',    color: 'text-red-600 bg-red-50 border border-red-200' },
  return:  { label: 'Retour',    color: 'text-blue-600 bg-blue-50 border border-blue-200' },
  damaged: { label: 'Endommagé', color: 'text-amber-600 bg-amber-50 border border-amber-200' },
  lost:    { label: 'Perdu',     color: 'text-gray-600 bg-gray-100 border border-gray-200' },
}

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, lowStock: 0, projects: 0, movements: 0 })
  const [recentMovements, setRecentMovements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [{ data: components }, { data: projects }, { data: movements }] = await Promise.all([
        supabase.from('components').select('quantity, safety_stock'),
        supabase.from('projects').select('id'),
        supabase.from('stock_movements')
          .select('id, type, quantity, date, component_id(name)')
          .order('date', { ascending: false })
          .limit(5),
      ])
      setStats({
        total: components?.length ?? 0,
        lowStock: components?.filter(c => c.quantity <= c.safety_stock).length ?? 0,
        projects: projects?.length ?? 0,
        movements: movements?.length ?? 0,
      })
      setRecentMovements(movements ?? [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const statCards = [
    { label: 'Types de composants', value: stats.total,     icon: Package,      iconClass: 'text-blue-600',    bgClass: 'bg-blue-50',    borderClass: 'border-blue-100',    valueClass: 'text-blue-700' },
    { label: 'Alertes stock bas',   value: stats.lowStock,  icon: AlertTriangle, iconClass: 'text-amber-600',  bgClass: 'bg-amber-50',   borderClass: 'border-amber-100',   valueClass: 'text-amber-700' },
    { label: 'Projets enregistrés', value: stats.projects,  icon: FolderKanban,  iconClass: 'text-violet-600', bgClass: 'bg-violet-50',  borderClass: 'border-violet-100',  valueClass: 'text-violet-700' },
    { label: 'Mouvements récents',  value: stats.movements, icon: ArrowUpDown,   iconClass: 'text-emerald-600', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-100', valueClass: 'text-emerald-700' },
  ]

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Welcome bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-gray-900">Bonjour 👋</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 self-start sm:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-600 font-medium">Système opérationnel</span>
        </div>
      </div>

      {/* Stat cards — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {statCards.map(({ label, value, icon: Icon, iconClass, bgClass, borderClass, valueClass }) => (
          <div key={label} className={`bg-white rounded-xl p-4 lg:p-5 border ${borderClass} shadow-sm`}>
            <div className="flex items-start justify-between mb-3 lg:mb-4">
              <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-lg ${bgClass} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${iconClass}`} />
              </div>
              <TrendingUp className="w-3.5 h-3.5 text-gray-300 hidden sm:block" />
            </div>
            <p className={`text-xl lg:text-2xl font-bold tabular-nums ${valueClass}`}>
              {loading ? '—' : value}
            </p>
            <p className="text-xs text-gray-500 mt-1 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Main grid — stacked on mobile, side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Bar chart */}
        <div className="lg:col-span-3 bg-white rounded-xl p-4 lg:p-5 border border-gray-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Niveaux de stock</h3>
            <p className="text-xs text-gray-400">Par catégorie · données exemple</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={mockStockData} barSize={22}>
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: 12 }}
                labelStyle={{ color: '#374151' }}
                itemStyle={{ color: '#7c3aed' }}
                cursor={{ fill: 'rgba(124,58,237,0.05)' }}
              />
              <Bar dataKey="stock" radius={[4, 4, 0, 0]}>
                {mockStockData.map((entry, i) => (
                  <Cell key={i} fill={entry.stock < 50 ? '#f59e0b' : '#7c3aed'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent movements */}
        <div className="lg:col-span-2 bg-white rounded-xl p-4 lg:p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Derniers mouvements</h3>
            <Clock className="w-3.5 h-3.5 text-gray-400" />
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : recentMovements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 text-center">
              <ArrowUpDown className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-xs text-gray-400">Aucun mouvement enregistré</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentMovements.map((m) => {
                const config = movementTypeConfig[m.type] || movementTypeConfig.entry
                return (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{m.component_id?.name || 'Composant'}</p>
                      <p className="text-[10px] text-gray-400">{new Date(m.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400">×{m.quantity}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${config.color}`}>{config.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
