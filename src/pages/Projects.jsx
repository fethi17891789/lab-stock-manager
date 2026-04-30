import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Plus, FolderKanban, Check, X, FileText, Package, GraduationCap, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const statusConfig = {
  pending_teacher: { label: 'En attente Enseignant', color: 'bg-amber-50 text-amber-600 border-amber-200' },
  rejected_teacher: { label: 'Refusé par Enseignant', color: 'bg-red-50 text-red-600 border-red-200' },
  pending_lab: { label: 'En attente Laborantin', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  rejected_lab: { label: 'Refusé par Laboratoire', color: 'bg-red-50 text-red-600 border-red-200' },
  approved: { label: 'Approuvé & Délivré', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
}

// --- STUDENT VIEW ---
function StudentProjects({ profile }) {
  const [requests, setRequests] = useState([])
  const [teachers, setTeachers] = useState([])
  const [components, setComponents] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [type, setType] = useState('mini_project')
  const [teacherId, setTeacherId] = useState('')
  const [reqItems, setReqItems] = useState([{ compId: '', quantity: 1 }])

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)

    const [{ data: reqs }, { data: tchs }, { data: comps }] = await Promise.all([
      supabase.from('project_requests').select('*').eq('student_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, name, firstname').eq('role', 'teacher'),
      supabase.from('components').select('id, name, code, quantity').order('name'),
    ])

    const reqList = reqs || []
    setTeachers(tchs || [])
    setComponents(comps || [])

    if (reqList.length === 0) { setRequests([]); setLoading(false); return }

    const reqIds = reqList.map(r => r.id)
    const teacherIds = [...new Set(reqList.map(r => r.teacher_id))]

    const [{ data: allItems }, { data: teacherProfiles }] = await Promise.all([
      supabase.from('project_request_items').select('*').in('request_id', reqIds),
      supabase.from('profiles').select('id, name, firstname').in('id', teacherIds),
    ])

    const compIds = [...new Set((allItems || []).map(i => i.component_id))]
    const { data: compsData } = compIds.length > 0
      ? await supabase.from('components').select('id, name, code').in('id', compIds)
      : { data: [] }

    const compMap = Object.fromEntries((compsData || []).map(c => [c.id, c]))
    const teacherMap = Object.fromEntries((teacherProfiles || []).map(t => [t.id, t]))

    setRequests(reqList.map(req => ({
      ...req,
      teacher: teacherMap[req.teacher_id] || null,
      items: (allItems || []).filter(i => i.request_id === req.id).map(i => ({ ...i, component: compMap[i.component_id] || null }))
    })))
    setLoading(false)
  }

  async function handleSubmit() {
    if (!title || !teacherId || reqItems.some(i => !i.compId || i.quantity < 1)) return
    setSaving(true)

    const { data: request, error } = await supabase.from('project_requests').insert({
      title,
      type,
      student_id: profile.id,
      teacher_id: teacherId,
      status: 'pending_teacher'
    }).select().single()

    if (error || !request) {
      setSaving(false)
      return
    }

    const itemsToInsert = reqItems.map(item => ({
      request_id: request.id,
      component_id: item.compId,
      quantity: parseInt(item.quantity)
    }))

    await supabase.from('project_request_items').insert(itemsToInsert)
    
    setSaving(false)
    setOpen(false)
    setTitle('')
    setType('mini_project')
    setTeacherId('')
    setReqItems([{ compId: '', quantity: 1 }])
    fetchAll()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Mes Demandes de Projets</h2>
        <Button onClick={() => setOpen(true)} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Nouvelle Demande
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement...</p>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          <FolderKanban className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>Aucune demande de projet pour le moment.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map(req => {
            const status = statusConfig[req.status] || statusConfig.pending_teacher
            return (
              <div key={req.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">{req.title}</h3>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 mb-1 ${req.type === 'pfe' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                    {req.type === 'pfe' ? 'PFE' : 'Mini-projet'}
                  </span>
                  <p className="text-sm text-gray-500">Superviseur : {req.teacher?.name || 'Inconnu'}</p>
                  <p className="text-xs text-gray-400 mt-1">Fait le {new Date(req.created_at).toLocaleDateString('fr-FR')}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {req.items.map((item, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium border border-gray-200">
                        {item.quantity}x {item.component?.name || 'Composant'}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-start shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CREATE DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Faire une demande de projet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Titre du projet</Label>
              <Input placeholder="ex: Robot suiveur de ligne" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Type de projet</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('mini_project')}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${type === 'mini_project' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'}`}
                >
                  Mini-projet
                </button>
                <button
                  type="button"
                  onClick={() => setType('pfe')}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${type === 'pfe' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'}`}
                >
                  PFE
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Enseignant Superviseur</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger><SelectValue placeholder="Choisir un enseignant" /></SelectTrigger>
                <SelectContent>
                  {teachers.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.firstname} {t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>Composants nécessaires</Label>
                <Button variant="outline" size="sm" onClick={() => setReqItems([...reqItems, { compId: '', quantity: 1 }])}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter composant
                </Button>
              </div>
              
              {reqItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Select value={item.compId} onValueChange={v => {
                    const newItems = [...reqItems]; newItems[idx].compId = v; setReqItems(newItems)
                  }}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Composant" /></SelectTrigger>
                    <SelectContent>
                      {components.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} <span className="text-gray-400 text-xs">({c.quantity} en stock)</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input 
                    type="number" min="1" className="w-20" value={item.quantity} 
                    onChange={e => { const newItems = [...reqItems]; newItems[idx].quantity = e.target.value; setReqItems(newItems) }}
                  />
                  <Button variant="ghost" className="text-red-500 px-2" disabled={reqItems.length === 1}
                    onClick={() => setReqItems(reqItems.filter((_, i) => i !== idx))}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-violet-600 text-white">
              {saving ? 'Envoi...' : 'Soumettre la demande'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- TEACHER VIEW ---
function TeacherProjects({ profile }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchRequests() }, [])

  async function fetchRequests() {
    setLoading(true)

    const { data: reqs } = await supabase.from('project_requests').select('*')
      .eq('teacher_id', profile.id).eq('status', 'pending_teacher').order('created_at', { ascending: false })

    const reqList = reqs || []
    if (reqList.length === 0) { setRequests([]); setLoading(false); return }

    const reqIds = reqList.map(r => r.id)
    const studentIds = [...new Set(reqList.map(r => r.student_id))]

    const [{ data: allItems }, { data: studentProfiles }] = await Promise.all([
      supabase.from('project_request_items').select('*').in('request_id', reqIds),
      supabase.from('profiles').select('id, name, firstname').in('id', studentIds),
    ])

    const compIds = [...new Set((allItems || []).map(i => i.component_id))]
    const { data: compsData } = compIds.length > 0
      ? await supabase.from('components').select('id, name, code').in('id', compIds)
      : { data: [] }

    const compMap = Object.fromEntries((compsData || []).map(c => [c.id, c]))
    const studentMap = Object.fromEntries((studentProfiles || []).map(s => [s.id, s]))

    setRequests(reqList.map(req => ({
      ...req,
      student: studentMap[req.student_id] || null,
      items: (allItems || []).filter(i => i.request_id === req.id).map(i => ({ ...i, component: compMap[i.component_id] || null }))
    })))
    setLoading(false)
  }

  async function updateStatus(id, newStatus) {
    await supabase.from('project_requests').update({ status: newStatus }).eq('id', id)
    fetchRequests()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Demandes en attente de validation</h2>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement...</p>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          <Check className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>Vous n'avez aucune demande en attente.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map(req => (
            <div key={req.id} className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">{req.title}</h3>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 mb-1 ${req.type === 'pfe' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                  {req.type === 'pfe' ? 'PFE' : 'Mini-projet'}
                </span>
                <p className="text-sm text-gray-500">Étudiant : {req.student?.firstname} {req.student?.name}</p>
                <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Matériel demandé :</p>
                  <ul className="space-y-1">
                    {req.items.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="w-6 text-right font-medium">{item.quantity}x</span> 
                        {item.component?.name} <span className="text-xs text-gray-400">({item.component?.code})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button onClick={() => updateStatus(req.id, 'pending_lab')} className="bg-blue-600 hover:bg-blue-700 text-white w-full gap-2">
                  <Check className="w-4 h-4" /> Approuver
                </Button>
                <Button onClick={() => updateStatus(req.id, 'rejected_teacher')} variant="outline" className="text-red-600 hover:bg-red-50 border-red-200 w-full gap-2">
                  <X className="w-4 h-4" /> Refuser
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --- LABORANTIN VIEW ---
function LabProjects() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchRequests() }, [])

  async function fetchRequests() {
    setLoading(true)

    const { data: reqs } = await supabase.from('project_requests').select('*')
      .in('status', ['pending_lab', 'approved']).order('created_at', { ascending: false })

    const reqList = reqs || []
    if (reqList.length === 0) { setRequests([]); setLoading(false); return }

    const reqIds = reqList.map(r => r.id)
    const personIds = [...new Set([...reqList.map(r => r.student_id), ...reqList.map(r => r.teacher_id)])]

    const [{ data: allItems }, { data: personProfiles }] = await Promise.all([
      supabase.from('project_request_items').select('*').in('request_id', reqIds),
      supabase.from('profiles').select('id, name, firstname').in('id', personIds),
    ])

    const compIds = [...new Set((allItems || []).map(i => i.component_id))]
    const { data: compsData } = compIds.length > 0
      ? await supabase.from('components').select('id, name, code, quantity').in('id', compIds)
      : { data: [] }

    const compMap = Object.fromEntries((compsData || []).map(c => [c.id, c]))
    const profileMap = Object.fromEntries((personProfiles || []).map(p => [p.id, p]))

    setRequests(reqList.map(req => ({
      ...req,
      student: profileMap[req.student_id] || null,
      teacher: profileMap[req.teacher_id] || null,
      items: (allItems || []).filter(i => i.request_id === req.id).map(i => ({ ...i, component: compMap[i.component_id] || null }))
    })))
    setLoading(false)
  }

  async function approveRequest(req) {
    // 1. Déstocker
    for (const item of req.items) {
      const newQty = Math.max(0, (item.component?.quantity || 0) - item.quantity)
      await supabase.from('components').update({ quantity: newQty }).eq('id', item.component_id)
      
      // Mouvement de stock
      await supabase.from('stock_movements').insert({
        component_id: item.component_id,
        type: 'exit',
        quantity: item.quantity,
        date: new Date().toISOString()
      })
    }

    // 2. Mettre à jour la requête
    await supabase.from('project_requests').update({ status: 'approved' }).eq('id', req.id)
    fetchRequests()
  }

  async function rejectRequest(reqId) {
    await supabase.from('project_requests').update({ status: 'rejected_lab' }).eq('id', reqId)
    fetchRequests()
  }

  function generateComponentsPDF(req) {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(`Liste de préparation - ${req.title}`, 14, 20)
    doc.setFontSize(10)
    doc.text(`Étudiant: ${req.student?.firstname} ${req.student?.name}`, 14, 28)

    autoTable(doc, {
      startY: 35,
      head: [['Composant', 'Référence', 'Quantité à préparer']],
      body: req.items.map(item => [item.component?.name || '?', item.component?.code || '?', item.quantity]),
    })

    doc.save(`preparation-${req.title}.pdf`)
  }

  function generateProjectPDF(req) {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text(`Fiche Récapitulative de Projet`, 14, 20)

    doc.setFontSize(12)
    doc.text(`Titre du projet : ${req.title}`, 14, 35)
    doc.text(`Type : ${req.type === 'pfe' ? 'Projet de Fin d\'Études (PFE)' : 'Mini-projet'}`, 14, 45)
    doc.text(`Étudiant : ${req.student?.firstname} ${req.student?.name}`, 14, 55)
    doc.text(`Enseignant superviseur : ${req.teacher?.firstname} ${req.teacher?.name}`, 14, 65)
    doc.text(`Date de demande : ${new Date(req.created_at).toLocaleDateString('fr-FR')}`, 14, 75)
    doc.text(`Statut : ${statusConfig[req.status]?.label}`, 14, 85)

    autoTable(doc, {
      startY: 95,
      head: [['Composant Alloué', 'Référence', 'Quantité']],
      body: req.items.map(item => [item.component?.name, item.component?.code, item.quantity]),
    })

    doc.save(`fiche-projet-${req.title}.pdf`)
  }

  const pendingRequests = requests.filter(r => r.status === 'pending_lab')
  const approvedRequests = requests.filter(r => r.status === 'approved')

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">À préparer (Validé par enseignant)</h2>
        {pendingRequests.length === 0 ? (
           <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500 text-sm">
             Aucune demande en attente de préparation.
           </div>
        ) : (
          <div className="grid gap-4">
            {pendingRequests.map(req => (
              <div key={req.id} className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">{req.title}</h3>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 mb-1 ${req.type === 'pfe' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                    {req.type === 'pfe' ? 'PFE' : 'Mini-projet'}
                  </span>
                  <p className="text-sm text-gray-500">Étudiant : {req.student?.firstname} {req.student?.name}</p>
                  <p className="text-sm text-gray-500">Enseignant : {req.teacher?.firstname} {req.teacher?.name}</p>
                  
                  <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Stock à retirer :</p>
                    <ul className="space-y-1">
                      {req.items.map((item, idx) => {
                        const inStock = item.component?.quantity || 0
                        const isShort = inStock < item.quantity
                        return (
                          <li key={idx} className="text-sm flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">{item.quantity}x</span> 
                              <span className="text-gray-600">{item.component?.name}</span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-md ${isShort ? 'bg-red-100 text-red-700 font-bold' : 'bg-gray-100 text-gray-500'}`}>
                              Stock: {inStock}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button onClick={() => approveRequest(req)} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full gap-2">
                    <Check className="w-4 h-4" /> Valider & Déstocker
                  </Button>
                  <Button onClick={() => rejectRequest(req.id)} variant="outline" className="text-red-600 hover:bg-red-50 border-red-200 w-full gap-2">
                    <X className="w-4 h-4" /> Refuser
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Historique des projets approuvés</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Projet</TableHead>
                <TableHead>Étudiant</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Documents</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedRequests.map(req => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium text-gray-800">{req.title}</TableCell>
                  <TableCell className="text-gray-600">{req.student?.firstname} {req.student?.name}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{new Date(req.created_at).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => generateComponentsPDF(req)} title="Liste de préparation" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                        <Package className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => generateProjectPDF(req)} title="Fiche projet globale" className="text-violet-600 border-violet-200 hover:bg-violet-50">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {approvedRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-gray-400">Aucun projet approuvé.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

// --- MAIN DISPATCHER ---
export default function Projects() {
  const { profile } = useAuth()
  if (!profile) return <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
  
  if (profile.role === 'student') return <StudentProjects profile={profile} />
  if (profile.role === 'teacher') return <TeacherProjects profile={profile} />
  if (profile.role === 'laborantin') return <LabProjects />
  
  return <div className="p-8 text-center text-red-500">Rôle non autorisé ou inconnu</div>
}
