import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Cpu, FolderKanban, Users,
  ArrowLeftRight, Archive, BarChart3, Zap
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/components', icon: Cpu, label: 'Composants' },
  { path: '/projects', icon: FolderKanban, label: 'Projets' },
  { path: '/students', icon: Users, label: 'Étudiants' },
  { path: '/stock', icon: ArrowLeftRight, label: 'Mouvements' },
  { path: '/storage', icon: Archive, label: 'Stockage' },
  { path: '/reports', icon: BarChart3, label: 'Rapports' },
]

export default function Sidebar() {
  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200">
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-tight">LabStock</p>
          <p className="text-xs text-gray-400 truncate">Gestion de composants</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-3">Menu</p>
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group
              ${isActive
                ? 'text-violet-700 bg-violet-50'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-violet-500" />
                )}
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-violet-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs text-gray-400">SquadLab · 2026</p>
        </div>
      </div>
    </aside>
  )
}
