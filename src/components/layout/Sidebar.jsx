import SidebarContent from './SidebarContent'

export default function Sidebar() {
  return (
    <aside className="w-60 border-r border-gray-200 shrink-0 hidden lg:flex flex-col">
      <SidebarContent />
    </aside>
  )
}
