import { useLocation } from 'react-router-dom'
import { Search, Bell, Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import SidebarContent from './SidebarContent'

const pageTitles = {
  '/dashboard':  { title: 'Dashboard',           subtitle: "Vue d'ensemble du laboratoire" },
  '/components': { title: 'Composants',           subtitle: 'Stock de composants électroniques' },
  '/projects':   { title: 'Projets',              subtitle: 'Mini-projets et projets de fin de formation' },
  '/students':   { title: 'Étudiants',            subtitle: 'Gestion des étudiants' },
  '/stock':      { title: 'Mouvements de stock',  subtitle: 'Entrées, sorties et retours' },
  '/storage':    { title: 'Stockage',             subtitle: 'Laboratoires, armoires et emplacements' },
  '/reports':    { title: 'Rapports',             subtitle: 'Statistiques et exports PDF' },
}

export default function Header({ mobileOpen, onMenuClick, onMobileClose }) {
  const { pathname } = useLocation()
  const page = pageTitles[pathname] || { title: 'LabStock', subtitle: '' }

  return (
    <>
      {/* Mobile nav drawer */}
      <Sheet open={mobileOpen} onOpenChange={onMobileClose}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent onNavClick={onMobileClose} />
        </SheetContent>
      </Sheet>

      <header className="h-14 lg:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
        <div className="flex items-center gap-3">
          {/* Hamburger - mobile only */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">{page.title}</h1>
            <p className="text-xs text-gray-400 hidden sm:block">{page.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search - hidden on very small screens */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              className="pl-8 h-8 w-36 lg:w-48 bg-gray-50 border-gray-200 text-sm placeholder:text-gray-400 focus-visible:ring-violet-500"
            />
          </div>
          <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
          </button>
        </div>
      </header>
    </>
  )
}
