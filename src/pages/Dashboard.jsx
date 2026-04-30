import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  Package, AlertTriangle, FolderKanban,
  ArrowUpDown, TrendingUp, Clock, GraduationCap, BookOpen
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const movementTypeConfig = {
  entry:   { label: 'Entrée',    color: 'text-emerald-600 bg-emerald-50 border border-emerald-200' },
  exit:    { label: 'Sortie',    color: 'text-red-600 bg-red-50 border border-red-200' },
  return:  { label: 'Retour',    color: 'text-blue-600 bg-blue-50 border border-blue-200' },
  damaged: { label: 'Endommagé', color: 'text-amber-600 bg-amber-50 border border-amber-200' },
  lost:    { label: 'Perdu',     color: 'text-gray-600 bg-gray-100 border border-gray-200' },
}

// ─── Dashboard Laborantin (accès complet) ───────────────────────────────────
function DashboardLaborantin() {
  const [stats, setStats] = useState({ total: 0, lowStock: 0, projects: 0, movements: 0, totalStock: 0 })
  const [stockData, setStockData] = useState([])
  const [recentMovements, setRecentMovements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [{ data: components }, { data: projects }, { data: movements }] = await Promise.all([
        supabase.from('components').select('name, quantity, safety_stock'),
        supabase.from('projects').select('id'),
        supabase.from('stock_movements')
          .select('id, type, quantity, date, component_id(name)')
          .order('date', { ascending: false }).limit(5),
      ])
      const comps = components || []
      const totalStock = comps.reduce((sum, c) => sum + (c.quantity || 0), 0)
      setStats({
        total: comps.length,
        lowStock: comps.filter(c => c.quantity <= c.safety_stock).length,
        projects: projects?.length ?? 0,
        movements: movements?.length ?? 0,
        totalStock,
      })
      // Top 10 components by quantity for chart
      const chartData = [...comps]
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10)
        .map(c => ({ name: c.name.length > 15 ? c.name.slice(0, 15) + '…' : c.name, stock: c.quantity, safety: c.safety_stock }))
      setStockData(chartData)
      setRecentMovements(movements ?? [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const statCards = [
    { label: 'Types de composants', value: stats.total,      icon: Package,      iconClass: 'text-blue-600',    bgClass: 'bg-blue-50',    borderClass: 'border-blue-100',    valueClass: 'text-blue-700' },
    { label: 'Stock total (unités)',value: stats.totalStock, icon: TrendingUp,   iconClass: 'text-cyan-600',    bgClass: 'bg-cyan-50',    borderClass: 'border-cyan-100',    valueClass: 'text-cyan-700' },
    { label: 'Alertes stock bas',   value: stats.lowStock,   icon: AlertTriangle, iconClass: 'text-amber-600',  bgClass: 'bg-amber-50',   borderClass: 'border-amber-100',   valueClass: 'text-amber-700' },
    { label: 'Projets enregistrés', value: stats.projects,   icon: FolderKanban,  iconClass: 'text-violet-600', bgClass: 'bg-violet-50',  borderClass: 'border-violet-100',  valueClass: 'text-violet-700' },
  ]

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {statCards.map(({ label, value, icon: Icon, iconClass, bgClass, borderClass, valueClass }) => (
          <div key={label} className={`bg-white rounded-xl p-4 lg:p-5 border ${borderClass} shadow-sm`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-8 h-8 rounded-lg ${bgClass} flex items-center justify-center`}>
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-xl p-4 lg:p-5 border border-gray-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Niveaux de stock</h3>
            <p className="text-xs text-gray-400">Top composants par quantité</p>
          </div>
          {stockData.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-[180px] text-center">
              <Package className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-xs text-gray-400">Aucun composant enregistré</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stockData} barSize={22}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: 12 }}
                  labelStyle={{ color: '#374151' }}
                  formatter={(value, name, props) => {
                    const item = props.payload
                    return [<span key="v">{value} unités {item.stock <= item.safety ? '⚠️ stock bas' : ''}</span>, 'Stock']
                  }}
                  cursor={{ fill: 'rgba(124,58,237,0.05)' }}
                />
                <Bar dataKey="stock" radius={[4, 4, 0, 0]}>
                  {stockData.map((entry, i) => (
                    <Cell key={i} fill={entry.stock <= entry.safety ? '#f59e0b' : '#7c3aed'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl p-4 lg:p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Derniers mouvements</h3>
            <Clock className="w-3.5 h-3.5 text-gray-400" />
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : recentMovements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 text-center">
              <ArrowUpDown className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-xs text-gray-400">Aucun mouvement enregistré</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentMovements.map(m => {
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

// ─── Dashboard Enseignant ────────────────────────────────────────────────────
function DashboardTeacher({ profile }) {
  const [stats, setStats] = useState({ projects: 0, components: 0 })
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [{ data: proj }, { data: comp }] = await Promise.all([
        supabase.from('projects').select('id, title, type, created_at')
          .eq('supervisor_name', profile?.name || '')
          .order('created_at', { ascending: false }).limit(5),
        supabase.from('components').select('id'),
      ])
      setProjects(proj ?? [])
      setStats({ projects: proj?.length ?? 0, components: comp?.length ?? 0 })
      setLoading(false)
    }
    fetchData()
  }, [profile])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 border border-violet-100 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center mb-4">
            <FolderKanban className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-2xl font-bold text-violet-700">{loading ? '—' : stats.projects}</p>
          <p className="text-xs text-gray-500 mt-1">Mes projets supervisés</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-blue-100 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700">{loading ? '—' : stats.components}</p>
          <p className="text-xs text-gray-500 mt-1">Composants disponibles</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Mes projets récents</h3>
        {loading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8">
            <FolderKanban className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Aucun projet trouvé</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <p className="text-sm font-medium text-gray-700">{p.title}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.type === 'final_project' ? 'bg-violet-50 text-violet-600 border border-violet-200' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                  {p.type === 'final_project' ? 'Projet final' : 'Mini-projet'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Interface enseignant</p>
            <p className="text-xs text-amber-600 mt-1">La gestion complète des projets et l'affectation des composants aux étudiants seront disponibles prochainement.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const reqStatusConfig = {
  pending_teacher: { label: 'En attente enseignant', color: 'bg-amber-50 text-amber-600 border-amber-200' },
  rejected_teacher: { label: 'Refusé',               color: 'bg-red-50 text-red-600 border-red-200' },
  pending_lab:     { label: 'En attente laborantin', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  rejected_lab:    { label: 'Refusé',                color: 'bg-red-50 text-red-600 border-red-200' },
  approved:        { label: 'Approuvé & Délivré',    color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
}

// ─── Dashboard Étudiant ──────────────────────────────────────────────────────
function DashboardStudent({ profile }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('project_requests')
        .select('id, title, type, status, created_at')
        .eq('student_id', profile?.id || '')
        .order('created_at', { ascending: false })
      setProjects(data ?? [])
      setLoading(false)
    }
    fetchData()
  }, [profile])

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl p-5 border border-blue-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <FolderKanban className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Mes demandes de projets</h3>
            <p className="text-xs text-gray-400">Suivi de vos demandes</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8">
            <FolderKanban className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Aucune demande pour l'instant</p>
            <p className="text-xs text-gray-300 mt-1">Allez dans "Projets" pour faire une demande</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map(p => {
              const st = reqStatusConfig[p.status] || reqStatusConfig.pending_teacher
              return (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{p.title}</p>
                    <span className={`text-xs font-medium ${p.type === 'pfe' ? 'text-violet-600' : 'text-blue-500'}`}>
                      {p.type === 'pfe' ? 'PFE' : 'Mini-projet'}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border shrink-0 ${st.color}`}>
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Dashboard principal (dispatch par rôle) ─────────────────────────────────
export default function Dashboard() {
  const { profile } = useAuth()

  const displayName = profile
    ? `${profile.firstname || ''} ${profile.name || ''}`.trim() || 'Utilisateur'
    : 'Utilisateur'

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Welcome bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-gray-900">
            Bonjour, {displayName} 👋
          </h2>
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

      {/* Vue selon le rôle */}
      {profile?.role === 'laborantin' && <DashboardLaborantin />}
      {profile?.role === 'teacher'    && <DashboardTeacher profile={profile} />}
      {profile?.role === 'student'    && <DashboardStudent profile={profile} />}
      {!profile && (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
