import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Cpu, FolderKanban, Users,
  ArrowLeftRight, Archive, BarChart3, Zap, LogOut
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const allNavItems = [
  { path: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',         roles: ['laborantin', 'teacher', 'student'] },
  { path: '/components', icon: Cpu,              label: 'Composants',        roles: ['laborantin'] },
  { path: '/projects',   icon: FolderKanban,     label: 'Projets',           roles: ['laborantin', 'teacher'] },
  { path: '/students',   icon: Users,            label: 'Étudiants',         roles: ['laborantin', 'teacher'] },
  { path: '/stock',      icon: ArrowLeftRight,   label: 'Mouvements',        roles: ['laborantin'] },
  { path: '/storage',    icon: Archive,          label: 'Stockage',          roles: ['laborantin'] },
  { path: '/reports',    icon: BarChart3,        label: 'Rapports',          roles: ['laborantin'] },
]

const roleLabels = {
  laborantin: { label: 'Laborantin', color: 'bg-emerald-100 text-emerald-700' },
  teacher:    { label: 'Enseignant', color: 'bg-violet-100 text-violet-700' },
  student:    { label: 'Étudiant',   color: 'bg-blue-100 text-blue-700' },
}

export default function SidebarContent({ onNavClick }) {
  const { profile, signOut } = useAuth()
  const role = profile?.role || 'student'
  const navItems = allNavItems.filter(item => item.roles.includes(role))
  const roleInfo = roleLabels[role] || roleLabels.student
  const displayName = profile
    ? `${profile.firstname || ''} ${profile.name || ''}`.trim() || 'Utilisateur'
    : '...'

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm leading-tight">LabStock</p>
          <p className="text-xs text-gray-400">Gestion de composants</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-3">Menu</p>
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onNavClick}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
              ${isActive
                ? 'text-violet-700 bg-violet-50'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-violet-500" />}
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-violet-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Utilisateur connecté + déconnexion */}
      <div className="px-4 py-4 border-t border-gray-200 shrink-0 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-violet-700">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{displayName}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleInfo.color}`}>
              {roleInfo.label}
            </span>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
