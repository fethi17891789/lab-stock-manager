import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Pencil, Trash2, Package, AlertTriangle, QrCode, Download, Printer } from 'lucide-react'
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
import { QRCodeSVG } from 'qrcode.react'

const statusConfig = {
  in_stock:   { label: 'En stock',    color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  in_project: { label: 'En projet',   color: 'bg-blue-50 text-blue-600 border-blue-200' },
  damaged:    { label: 'Endommagé',   color: 'bg-amber-50 text-amber-600 border-amber-200' },
  lost:       { label: 'Perdu',       color: 'bg-red-50 text-red-600 border-red-200' },
}

const emptyForm = { name: '', code: '', quantity: '', safety_stock: '', slot_id: '', status: 'in_stock' }

export default function Components() {
  const [components, setComponents] = useState([])
  const [labs, setLabs] = useState([])
  const [cabinets, setCabinets] = useState([])
  const [slots, setSlots] = useState([])
  const [filteredCabinets, setFilteredCabinets] = useState([])
  const [filteredSlots, setFilteredSlots] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [qrComp, setQrComp] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [selectedLab, setSelectedLab] = useState('')
  const [selectedCabinet, setSelectedCabinet] = useState('')
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null)
  const qrRef = useRef(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: comps }, { data: labsData }, { data: cabsData }, { data: slotsData }] = await Promise.all([
      supabase.from('components').select('*, slot_id(id, number, cabinet_id(id, name, laboratory_id(id, name)))'),
      supabase.from('laboratories').select('*').order('name'),
      supabase.from('cabinets').select('*').order('name'),
      supabase.from('slots').select('*').order('number'),
    ])
    setComponents(comps || [])
    setLabs(labsData || [])
    setCabinets(cabsData || [])
    setSlots(slotsData || [])
    setLoading(false)
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setSelectedLab('')
    setSelectedCabinet('')
    setFilteredCabinets([])
    setFilteredSlots([])
    setOpen(true)
  }

  function openEdit(comp) {
    setEditing(comp.id)
    const slot = comp.slot_id
    const cabinet = slot?.cabinet_id
    const lab = cabinet?.laboratory_id
    const labId = lab?.id || ''
    const cabId = cabinet?.id || ''
    setSelectedLab(labId)
    setSelectedCabinet(cabId)
    setFilteredCabinets(labId ? cabinets.filter(c => c.laboratory_id === labId) : [])
    setFilteredSlots(cabId ? slots.filter(s => s.cabinet_id === cabId) : [])
    setForm({
      name: comp.name,
      code: comp.code,
      quantity: String(comp.quantity),
      safety_stock: String(comp.safety_stock),
      slot_id: slot?.id || '',
      status: comp.status || 'in_stock',
    })
    setOpen(true)
  }

  function handleLabChange(labId) {
    setSelectedLab(labId)
    setSelectedCabinet('')
    setForm(f => ({ ...f, slot_id: '' }))
    setFilteredCabinets(cabinets.filter(c => c.laboratory_id === labId))
    setFilteredSlots([])
  }

  function handleCabinetChange(cabId) {
    setSelectedCabinet(cabId)
    setForm(f => ({ ...f, slot_id: '' }))
    setFilteredSlots(slots.filter(s => s.cabinet_id === cabId))
  }

  async function handleSave() {
    if (!form.name || !form.code) return
    setSaving(true)
    const payload = {
      name: form.name,
      code: form.code,
      quantity: parseInt(form.quantity) || 0,
      safety_stock: parseInt(form.safety_stock) || 0,
      slot_id: form.slot_id || null,
      status: form.status || 'in_stock',
    }
    if (editing) {
      await supabase.from('components').update(payload).eq('id', editing)
      setSaving(false)
      setOpen(false)
    } else {
      const { data } = await supabase.from('components').insert(payload).select('*, slot_id(id, number, cabinet_id(id, name, laboratory_id(id, name)))').single()
      setSaving(false)
      setOpen(false)
      if (data) setQrComp(data)
    }
    fetchAll()
  }

  async function handleDelete(id) {
    await supabase.from('components').delete().eq('id', id)
    setDeleteId(null)
    fetchAll()
  }

  function getQrData(comp) {
    return `${window.location.origin}/component/${comp.id}`
  }

  function handlePrintQr() {
    const svgEl = qrRef.current?.querySelector('svg')
    if (!svgEl) return
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>QR Code - ${qrComp?.code}</title>
      <style>
        body { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; margin:0; font-family:sans-serif; }
        svg { width:200px; height:200px; }
        h2 { margin:16px 0 4px; font-size:18px; }
        p  { margin:0; color:#666; font-size:13px; }
      </style></head>
      <body>
        ${svgData}
        <h2>${qrComp?.code}</h2>
        <p>${qrComp?.name}</p>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  function handleDownloadQr() {
    const svgEl = qrRef.current?.querySelector('svg')
    if (!svgEl) return
    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 300
    const ctx = canvas.getContext('2d')
    const img = new Image()
    const svgData = 'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(svgEl))
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 300, 300)
      ctx.drawImage(img, 0, 0, 300, 300)
      const a = document.createElement('a')
      a.download = `qr-${qrComp?.code}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    img.src = svgData
  }

  const filtered = components.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  function getLocation(comp) {
    const slot = comp.slot_id
    if (!slot) return '—'
    const cab = slot.cabinet_id
    const lab = cab?.laboratory_id
    return `${lab?.name || '?'} › ${cab?.name || '?'} › Tiroir ${slot.number}`
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom ou code..."
            className="pl-9 w-full sm:w-72 bg-white"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={openCreate} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
          <Plus className="w-4 h-4" />
          Ajouter un composant
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-500">Code</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500">Nom</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 text-center">Quantité</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 text-center">Seuil alerte</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500">Emplacement</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500">Statut</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(7)].map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-gray-400">
                  <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">{search ? 'Aucun résultat' : 'Aucun composant enregistré'}</p>
                  {!search && <p className="text-xs text-gray-300 mt-1">Cliquez sur "Ajouter un composant" pour commencer</p>}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(comp => {
                const isLow = comp.quantity <= comp.safety_stock
                return (
                  <TableRow key={comp.id} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-xs text-gray-500">{comp.code}</TableCell>
                    <TableCell className="font-medium text-gray-800">{comp.name}</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold tabular-nums ${isLow ? 'text-red-600' : 'text-gray-700'}`}>
                        {comp.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-gray-400 text-sm">{comp.safety_stock}</TableCell>
                    <TableCell className="text-xs text-gray-500">{getLocation(comp)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${(statusConfig[comp.status] || statusConfig.in_stock).color}`}>
                          {(statusConfig[comp.status] || statusConfig.in_stock).label}
                        </span>
                        {isLow && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-medium">
                            <AlertTriangle className="w-3 h-3" /> Stock bas
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setQrComp(comp)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-violet-600 transition-colors" title="QR Code">
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openEdit(comp)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-violet-600 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(comp.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog: Créer / Modifier */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le composant' : 'Ajouter un composant'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input placeholder="ex: Résistance 10kΩ" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Code / Référence *</Label>
                <Input placeholder="ex: RES-10K" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Quantité actuelle</Label>
                <Input type="number" min="0" placeholder="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Seuil d'alerte</Label>
                <Input type="number" min="0" placeholder="0" value={form.safety_stock} onChange={e => setForm(f => ({ ...f, safety_stock: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>État du composant</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(statusConfig).map(([key, val]) => (
                  <button key={key} type="button" onClick={() => setForm(f => ({ ...f, status: key }))}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${form.status === key ? `${val.color} border-current` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                    {val.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t pt-3 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Emplacement</p>
              {labs.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Aucun laboratoire créé. Allez dans <strong>Stockage</strong> pour en créer un d'abord.
                </p>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label>Laboratoire</Label>
                    <Select value={selectedLab} onValueChange={handleLabChange}>
                      <SelectTrigger><SelectValue placeholder="Choisir un laboratoire" /></SelectTrigger>
                      <SelectContent>
                        {labs.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Armoire</Label>
                    <Select value={selectedCabinet} onValueChange={handleCabinetChange} disabled={!selectedLab}>
                      <SelectTrigger><SelectValue placeholder={selectedLab ? 'Choisir une armoire' : "Choisissez un labo d'abord"} /></SelectTrigger>
                      <SelectContent>
                        {filteredCabinets.length === 0
                          ? <SelectItem value="none" disabled>Aucune armoire dans ce labo</SelectItem>
                          : filteredCabinets.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tiroir / Emplacement</Label>
                    <Select value={form.slot_id} onValueChange={v => setForm(f => ({ ...f, slot_id: v }))} disabled={!selectedCabinet}>
                      <SelectTrigger><SelectValue placeholder={selectedCabinet ? 'Choisir un tiroir' : "Choisissez une armoire d'abord"} /></SelectTrigger>
                      <SelectContent>
                        {filteredSlots.length === 0
                          ? <SelectItem value="none" disabled>Aucun tiroir dans cette armoire</SelectItem>
                          : filteredSlots.map(s => <SelectItem key={s.id} value={s.id}>Tiroir {s.number}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.code} className="bg-violet-600 hover:bg-violet-700 text-white">
              {saving ? 'Enregistrement...' : editing ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: QR Code */}
      <Dialog open={!!qrComp} onOpenChange={() => setQrComp(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-violet-600" />
              QR Code — {qrComp?.code}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div ref={qrRef} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
              {qrComp && (
                <QRCodeSVG
                  value={getQrData(qrComp)}
                  size={180}
                  level="M"
                  includeMargin={false}
                />
              )}
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800">{qrComp?.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">{qrComp?.code}</p>
              {qrComp?.slot_id && (
                <p className="text-xs text-gray-400 mt-1">{getLocation(qrComp)}</p>
              )}
            </div>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1 gap-2" onClick={handleDownloadQr}>
                <Download className="w-4 h-4" /> Télécharger
              </Button>
              <Button className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={handlePrintQr}>
                <Printer className="w-4 h-4" /> Imprimer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Suppression */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Supprimer ce composant ?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteId)}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
