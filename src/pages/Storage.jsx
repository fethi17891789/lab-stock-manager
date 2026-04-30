import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, FlaskConical, Box, Grid3x3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'

export default function Storage() {
  const [labs, setLabs] = useState([])
  const [cabinets, setCabinets] = useState([])
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)

  // Dialogs
  const [labDialog, setLabDialog] = useState(false)
  const [cabinetDialog, setCabinetDialog] = useState(false)
  const [slotDialog, setSlotDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, table: '', id: '' })

  // Forms
  const [labForm, setLabForm] = useState({ name: '', location: '' })
  const [cabinetForm, setCabinetForm] = useState({ name: '', laboratory_id: '' })
  const [slotForm, setSlotForm] = useState({ number: '', cabinet_id: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: l }, { data: c }, { data: s }] = await Promise.all([
      supabase.from('laboratories').select('*').order('name'),
      supabase.from('cabinets').select('*, laboratory_id(id, name)').order('name'),
      supabase.from('slots').select('*, cabinet_id(id, name, laboratory_id(name))').order('number'),
    ])
    setLabs(l || [])
    setCabinets(c || [])
    setSlots(s || [])
    setLoading(false)
  }

  async function saveLab() {
    if (!labForm.name) return
    setSaving(true)
    await supabase.from('laboratories').insert({ name: labForm.name, location: labForm.location || null })
    setSaving(false)
    setLabDialog(false)
    setLabForm({ name: '', location: '' })
    fetchAll()
  }

  async function saveCabinet() {
    if (!cabinetForm.name || !cabinetForm.laboratory_id) return
    setSaving(true)
    await supabase.from('cabinets').insert(cabinetForm)
    setSaving(false)
    setCabinetDialog(false)
    setCabinetForm({ name: '', laboratory_id: '' })
    fetchAll()
  }

  async function saveSlot() {
    if (!slotForm.number || !slotForm.cabinet_id) return
    setSaving(true)
    await supabase.from('slots').insert(slotForm)
    setSaving(false)
    setSlotDialog(false)
    setSlotForm({ number: '', cabinet_id: '' })
    fetchAll()
  }

  async function handleDelete() {
    const { table, id } = deleteDialog
    await supabase.from(table).delete().eq('id', id)
    setDeleteDialog({ open: false, table: '', id: '' })
    fetchAll()
  }

  const Section = ({ icon: Icon, title, subtitle, color, onAdd, addLabel, children }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
            <p className="text-xs text-gray-400">{subtitle}</p>
          </div>
        </div>
        <Button size="sm" onClick={onAdd} className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 h-8 text-xs">
          <Plus className="w-3.5 h-3.5" /> {addLabel}
        </Button>
      </div>
      {children}
    </div>
  )

  return (
    <div className="space-y-5">

      {/* Laboratoires */}
      <Section
        icon={FlaskConical}
        title="Laboratoires"
        subtitle="Espaces physiques du laboratoire"
        color="bg-blue-500"
        onAdd={() => setLabDialog(true)}
        addLabel="Ajouter un labo"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-500">Nom</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500">Localisation</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 text-center">Armoires</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4}><div className="h-8 bg-gray-100 rounded animate-pulse m-2" /></TableCell></TableRow>
            ) : labs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                  Aucun laboratoire créé
                </TableCell>
              </TableRow>
            ) : (
              labs.map(lab => (
                <TableRow key={lab.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-800">{lab.name}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{lab.location || '—'}</TableCell>
                  <TableCell className="text-center text-gray-500 text-sm">
                    {cabinets.filter(c => c.laboratory_id?.id === lab.id).length}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => setDeleteDialog({ open: true, table: 'laboratories', id: lab.id })}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Section>

      {/* Armoires */}
      <Section
        icon={Box}
        title="Armoires"
        subtitle="Meubles de rangement dans chaque labo"
        color="bg-violet-500"
        onAdd={() => setCabinetDialog(true)}
        addLabel="Ajouter une armoire"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-500">Nom</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500">Laboratoire</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 text-center">Tiroirs</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4}><div className="h-8 bg-gray-100 rounded animate-pulse m-2" /></TableCell></TableRow>
            ) : cabinets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                  Aucune armoire créée
                </TableCell>
              </TableRow>
            ) : (
              cabinets.map(cab => (
                <TableRow key={cab.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-800">{cab.name}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{cab.laboratory_id?.name || '—'}</TableCell>
                  <TableCell className="text-center text-gray-500 text-sm">
                    {slots.filter(s => s.cabinet_id?.id === cab.id).length}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => setDeleteDialog({ open: true, table: 'cabinets', id: cab.id })}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Section>

      {/* Tiroirs */}
      <Section
        icon={Grid3x3}
        title="Tiroirs / Emplacements"
        subtitle="Cases et tiroirs dans chaque armoire"
        color="bg-emerald-500"
        onAdd={() => setSlotDialog(true)}
        addLabel="Ajouter un tiroir"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-500">Numéro / Nom</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500">Armoire</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500">Laboratoire</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4}><div className="h-8 bg-gray-100 rounded animate-pulse m-2" /></TableCell></TableRow>
            ) : slots.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                  Aucun tiroir créé
                </TableCell>
              </TableRow>
            ) : (
              slots.map(slot => (
                <TableRow key={slot.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-800">Tiroir {slot.number}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{slot.cabinet_id?.name || '—'}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{slot.cabinet_id?.laboratory_id?.name || '—'}</TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => setDeleteDialog({ open: true, table: 'slots', id: slot.id })}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Section>

      {/* Dialog: Labo */}
      <Dialog open={labDialog} onOpenChange={setLabDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Ajouter un laboratoire</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nom du laboratoire *</Label>
              <Input placeholder="ex: Labo Electronique A" value={labForm.name} onChange={e => setLabForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Localisation</Label>
              <Input placeholder="ex: Bâtiment B - Salle 204" value={labForm.location} onChange={e => setLabForm(f => ({ ...f, location: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLabDialog(false)}>Annuler</Button>
            <Button onClick={saveLab} disabled={saving || !labForm.name} className="bg-violet-600 hover:bg-violet-700 text-white">
              {saving ? 'Enregistrement...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Armoire */}
      <Dialog open={cabinetDialog} onOpenChange={setCabinetDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Ajouter une armoire</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nom de l'armoire *</Label>
              <Input placeholder="ex: Armoire A1" value={cabinetForm.name} onChange={e => setCabinetForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Laboratoire *</Label>
              {labs.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Créez d'abord un laboratoire.
                </p>
              ) : (
                <Select value={cabinetForm.laboratory_id} onValueChange={v => setCabinetForm(f => ({ ...f, laboratory_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Choisir un laboratoire" /></SelectTrigger>
                  <SelectContent>
                    {labs.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCabinetDialog(false)}>Annuler</Button>
            <Button onClick={saveCabinet} disabled={saving || !cabinetForm.name || !cabinetForm.laboratory_id} className="bg-violet-600 hover:bg-violet-700 text-white">
              {saving ? 'Enregistrement...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Slot */}
      <Dialog open={slotDialog} onOpenChange={setSlotDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Ajouter un tiroir / emplacement</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Numéro / Nom *</Label>
              <Input placeholder="ex: A1, T3, Case-5" value={slotForm.number} onChange={e => setSlotForm(f => ({ ...f, number: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Armoire *</Label>
              {cabinets.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Créez d'abord une armoire.
                </p>
              ) : (
                <Select value={slotForm.cabinet_id} onValueChange={v => setSlotForm(f => ({ ...f, cabinet_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Choisir une armoire" /></SelectTrigger>
                  <SelectContent>
                    {cabinets.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.laboratory_id?.name})</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlotDialog(false)}>Annuler</Button>
            <Button onClick={saveSlot} disabled={saving || !slotForm.number || !slotForm.cabinet_id} className="bg-violet-600 hover:bg-violet-700 text-white">
              {saving ? 'Enregistrement...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteDialog.open} onOpenChange={() => setDeleteDialog({ open: false, table: '', id: '' })}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Confirmer la suppression</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">Cette action supprimera l'élément et tout ce qui en dépend.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, table: '', id: '' })}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
