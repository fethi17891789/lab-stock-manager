import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Cpu, FolderKanban, Users, ArrowLeftRight, Archive, BarChart3 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const allNavItems = [
  { path: '/dashboard',  icon: LayoutDashboard, label: 'Accueil',    roles: ['laborantin', 'teacher', 'student'] },
  { path: '/components', icon: Cpu,              label: 'Stock',      roles: ['laborantin'] },
  { path: '/projects',   icon: FolderKanban,     label: 'Projets',    roles: ['laborantin', 'teacher', 'student'] },
  { path: '/students',   icon: Users,            label: 'Étudiants',  roles: ['laborantin', 'teacher'] },
  { path: '/stock',      icon: ArrowLeftRight,   label: 'Mouvements', roles: ['laborantin'] },
  { path: '/storage',    icon: Archive,          label: 'Stockage',   roles: ['laborantin'] },
  { path: '/reports',    icon: BarChart3,        label: 'Rapports',   roles: ['laborantin'] },
]

export default function BottomNav() {
  const { profile } = useAuth()
  const role = profile?.role || 'student'
  const navItems = allNavItems.filter(item => item.roles.includes(role)).slice(0, 5)

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex safe-area-inset-bottom">
      {navItems.map(({ path, icon: Icon, label }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors
            ${isActive ? 'text-violet-600' : 'text-gray-400'}`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={`w-5 h-5 ${isActive ? 'text-violet-600' : 'text-gray-400'}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
