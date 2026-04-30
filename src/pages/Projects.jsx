import { FolderKanban } from 'lucide-react'

export default function Projects() {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
        <FolderKanban className="w-6 h-6 text-slate-500" />
      </div>
      <h2 className="text-slate-300 font-semibold">Projets</h2>
      <p className="text-slate-600 text-sm mt-1">En cours de développement</p>
    </div>
  )
}
