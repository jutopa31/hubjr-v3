import React, { useState } from 'react'
import type { WardPatient } from '../../types/ward'

type Props = {
  open: boolean
  onClose: () => void
  onCreate: (p: WardPatient) => Promise<void>
}

export default function PatientFormModal({ open, onClose, onCreate }: Props) {
  const [draft, setDraft] = useState<WardPatient>({
    fecha: new Date().toISOString().slice(0,10),
    nombre: '', dni: '', edad: '', sexo: '', cama: '', servicio: 'Sala', unidad: '',
    motivo_consulta: '', examen_fisico: '', estudios: '', diagnostico: '', severidad: 'I', plan: '', pendientes: '', status: 'activo'
  })
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl editor max-h-[90vh] overflow-y-auto">
        <div className="px-4 py-3 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="font-semibold">Nuevo paciente</h3>
          <button className="px-2 py-1 border rounded btn-soft" onClick={onClose}>Cerrar</button>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          <label className="col-span-2 text-xs text-gray-600">Nombre</label>
          <input className="border rounded p-2 col-span-2" value={draft.nombre} onChange={(e)=> setDraft({...draft, nombre:e.target.value})} />
          <input className="border rounded p-2" placeholder="DNI" value={draft.dni} onChange={(e)=> setDraft({...draft, dni:e.target.value})} />
          <input className="border rounded p-2" placeholder="Edad" value={draft.edad} onChange={(e)=> setDraft({...draft, edad:e.target.value})} />
          <input className="border rounded p-2" placeholder="Cama" value={draft.cama} onChange={(e)=> setDraft({...draft, cama:e.target.value})} />
          <select className="border rounded p-2" value={draft.severidad} onChange={(e)=> setDraft({...draft, severidad: e.target.value as any})}>
            <option>I</option><option>II</option><option>III</option><option>IV</option>
          </select>
          <select className="border rounded p-2" value={draft.servicio} onChange={(e)=> setDraft({...draft, servicio: e.target.value})}>
            <option>Sala</option><option>UCI</option><option>Guardia</option>
          </select>
          <textarea className="border rounded p-2 col-span-2" rows={2} placeholder="Motivo de consulta" value={draft.motivo_consulta} onChange={(e)=> setDraft({...draft, motivo_consulta:e.target.value})} />
          <textarea className="border rounded p-2 col-span-2" rows={2} placeholder="Examen físico" value={draft.examen_fisico} onChange={(e)=> setDraft({...draft, examen_fisico:e.target.value})} />
          <textarea className="border rounded p-2 col-span-2" rows={2} placeholder="Estudios" value={draft.estudios} onChange={(e)=> setDraft({...draft, estudios:e.target.value})} />
          <textarea className="border rounded p-2 col-span-2" rows={2} placeholder="Diagnóstico" value={draft.diagnostico} onChange={(e)=> setDraft({...draft, diagnostico:e.target.value})} />
          <textarea className="border rounded p-2 col-span-2" rows={2} placeholder="Plan" value={draft.plan} onChange={(e)=> setDraft({...draft, plan:e.target.value})} />
          <textarea className="border rounded p-2 col-span-2" rows={2} placeholder="Pendientes" value={draft.pendientes} onChange={(e)=> setDraft({...draft, pendientes:e.target.value})} />
          <div className="col-span-2 flex gap-2 pt-2 justify-end border-t pt-4 sticky bottom-0 bg-white">
            <button className="px-3 py-1 rounded border btn-soft" onClick={onClose}>Cancelar</button>
            <button className="px-3 py-1 rounded border btn-success" onClick={async ()=> { await onCreate(draft); onClose() }}>Crear</button>
          </div>
        </div>
      </div>
    </div>
  )
}
