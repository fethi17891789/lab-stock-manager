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
  entry:   { label: 'Entrée',      color: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' },
  exit:    { label: 'Sortie',      color: 'text-red-400 bg-red-500/10 border border-red-500/20' },
  return:  { label: 'Retour',      color: 'text-blue-400 bg-blue-500/10 border border-blue-500/20' },
  damaged: { label: 'Endommagé',   color: 'text-amber-400 bg-amber-500/10 border border-amber-500/20' },
  lost:    { label: 'Perdu',       color: 'text-slate-400 bg-slate-500/10 border border-slate-500/20' },
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
    {
      label: 'Types de composants',
      value: stats.total,
      icon: Package,
      iconClass: 'text-blue-400',
      bgClass: 'bg-blue-500/10',
      borderClass: 'border-blue-500/20',
    },
    {
      label: 'Alertes stock bas',
      value: stats.lowStock,
      icon: AlertTriangle,
      iconClass: 'text-amber-400',
      bgClass: 'bg-amber-500/10',
      borderClass: 'border-amber-500/20',
    },
    {
      label: 'Projets enregistrés',
      value: stats.projects,
      icon: FolderKanban,
      iconClass: 'text-violet-400',
      bgClass: 'bg-violet-500/10',
      borderClass: 'border-violet-500/20',
    },
    {
      label: 'Mouvements récents',
      value: stats.movements,
      icon: ArrowUpDown,
      iconClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10',
      borderClass: 'border-emerald-500/20',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Bonjour 👋</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Système opérationnel</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, iconClass, bgClass, borderClass }) => (
          <div
            key={label}
            className={`bg-slate-900 rounded-xl p-5 border ${borderClass} hover:brightness-110 transition-all`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-9 h-9 rounded-lg ${bgClass} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${iconClass}`} />
              </div>
              <TrendingUp className="w-3.5 h-3.5 text-slate-700" />
            </div>
            <p className="text-2xl font-bold text-slate-100 tabular-nums">
              {loading ? '—' : value}
            </p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-5 gap-4">
        {/* Bar chart */}
        <div className="col-span-3 bg-slate-900 rounded-xl p-5 border border-slate-800">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-slate-200">Niveaux de stock</h3>
            <p className="text-xs text-slate-500">Par catégorie · données exemple</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mockStockData} barSize={28}>
              <XAxis
                dataKey="name"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                labelStyle={{ color: '#cbd5e1' }}
                itemStyle={{ color: '#a78bfa' }}
                cursor={{ fill: 'rgba(124, 58, 237, 0.05)' }}
              />
              <Bar dataKey="stock" radius={[4, 4, 0, 0]}>
                {mockStockData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.stock < 50 ? '#f59e0b' : '#7c3aed'}
                    fillOpacity={0.75}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent movements */}
        <div className="col-span-2 bg-slate-900 rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Derniers mouvements</h3>
            <Clock className="w-3.5 h-3.5 text-slate-600" />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-800 rounded animate-pulse" />
              ))}
            </div>
          ) : recentMovements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <ArrowUpDown className="w-8 h-8 text-slate-700 mb-2" />
              <p className="text-xs text-slate-600">Aucun mouvement enregistré</p>
              <p className="text-xs text-slate-700 mt-1">Les mouvements apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentMovements.map((m) => {
                const config = movementTypeConfig[m.type] || movementTypeConfig.entry
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-300 truncate">
                        {m.component_id?.name || 'Composant'}
                      </p>
                      <p className="text-[10px] text-slate-600">
                        {new Date(m.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-500">×{m.quantity}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${config.color}`}>
                        {config.label}
                      </span>
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
