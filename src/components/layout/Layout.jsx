import { useState } from 'react'
import SidebarContent from './SidebarContent'
import Header from './Header'

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar mobile */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 lg:hidden
        transition-transform duration-200 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent onNavClick={() => setMobileOpen(false)} />
      </div>

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-gray-200 shrink-0 bg-white">
        <SidebarContent />
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
