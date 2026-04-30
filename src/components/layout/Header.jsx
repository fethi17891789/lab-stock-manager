import { useLocation } from 'react-router-dom'
import { Search, Bell } from 'lucide-react'
import { Input } from '@/components/ui/input'

const pageTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: "Vue d'ensemble du laboratoire" },
  '/components': { title: 'Composants', subtitle: 'Stock de composants électroniques' },
  '/projects': { title: 'Projets', subtitle: 'Mini-projets et projets de fin de formation' },
  '/students': { title: 'Étudiants', subtitle: 'Gestion des étudiants' },
  '/stock': { title: 'Mouvements de stock', subtitle: 'Entrées, sorties et retours' },
  '/storage': { title: 'Stockage', subtitle: 'Laboratoires, armoires et emplacements' },
  '/reports': { title: 'Rapports', subtitle: 'Statistiques et exports PDF' },
}

export default function Header() {
  const { pathname } = useLocation()
  const page = pageTitles[pathname] || { title: 'LabStock', subtitle: '' }

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-sm font-semibold text-slate-100">{page.title}</h1>
        <p className="text-xs text-slate-500">{page.subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <Input
            placeholder="Rechercher..."
            className="pl-8 h-8 w-48 bg-slate-800 border-slate-700 text-sm text-slate-300 placeholder:text-slate-600 focus-visible:ring-violet-500"
          />
        </div>
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
        </button>
      </div>
    </header>
  )
}
