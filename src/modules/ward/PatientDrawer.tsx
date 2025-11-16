import React, { useEffect, useState } from 'react'
import type { WardPatient, ResidentProfile } from '../../types/ward'

type Props = {
  open: boolean
  onClose: () => void
  patient?: WardPatient | null
  onSave: (id: string, patch: Partial<WardPatient>) => Promise<void>
  residents: ResidentProfile[]
}

export default function PatientDrawer({ open, onClose, patient, onSave, residents }: Props) {
  const [form, setForm] = useState<WardPatient | null>(null)
  useEffect(() => { setForm(patient || null) }, [patient])
  if (!open) return null
  return (
    <div className={`fixed top-0 right-0 h-full w-[560px] editor shadow-2xl transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="px-4 py-3 border-b flex items-center justify-between sticky top-0 bg-white z-10">
        <h3 className="text-base font-semibold">Detalle del paciente</h3>
        <button className="px-2 py-1 border rounded btn-soft" onClick={onClose}>Cerrar</button>
      </div>
      <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-56px)]">
        {!form && <div className="text-sm text-gray-500">Sin selección</div>}
        {form && (
          <>
            <div className="space-y-4">
              <div className="section">
                <div className="section-header">Datos básicos</div>
                <div className="section-body grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-gray-600">Nombre</label>
                    <input className="border rounded p-2 w-full" value={form.nombre} onChange={(e) => setForm({ ...form!, nombre: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">DNI</label>
                    <input className="border rounded p-2 w-full" value={form.dni} onChange={(e) => setForm({ ...form!, dni: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Edad</label>
                    <input className="border rounded p-2 w-full" value={form.edad} onChange={(e) => setForm({ ...form!, edad: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="section">
                <div className="section-header">Ubicación y severidad</div>
                <div className="section-body grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600">Cama</label>
                    <input className="border rounded p-2 w-full" value={form.cama} onChange={(e) => setForm({ ...form!, cama: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Severidad</label>
                    <select className="border rounded p-2 w-full" value={form.severidad} onChange={(e) => setForm({ ...form!, severidad: e.target.value as any })}>
                      <option>I</option>
                      <option>II</option>
                      <option>III</option>
                      <option>IV</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Servicio</label>
                    <select className="border rounded p-2 w-full" value={form.servicio || ''} onChange={(e) => setForm({ ...form!, servicio: e.target.value || undefined })}>
                      <option value="">—</option>
                      <option>Sala</option>
                      <option>UCI</option>
                      <option>Guardia</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Residente asignado</label>
                    <select className="border rounded p-2 w-full" value={form.assigned_resident_id || ''} onChange={(e) => setForm({ ...form!, assigned_resident_id: e.target.value || undefined })}>
                      <option value="">Sin asignar</option>
                      {residents.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="section">
                <div className="section-header">Clínica y estudios</div>
                <div className="section-body grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-xs text-gray-600">Motivo de consulta</label>
                    <textarea className="border rounded p-2 w-full" rows={3} value={form.motivo_consulta} onChange={(e) => setForm({ ...form!, motivo_consulta: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Examen físico</label>
                    <textarea className="border rounded p-2 w-full" rows={3} value={form.examen_fisico} onChange={(e) => setForm({ ...form!, examen_fisico: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Estudios</label>
                    <textarea className="border rounded p-2 w-full" rows={3} value={form.estudios} onChange={(e) => setForm({ ...form!, estudios: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Diagnóstico</label>
                    <textarea className="border rounded p-2 w-full" rows={3} value={form.diagnostico} onChange={(e) => setForm({ ...form!, diagnostico: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="section">
                <div className="section-header">Plan y pendientes</div>
                <div className="section-body grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-xs text-gray-600">Plan</label>
                    <textarea className="border rounded p-2 w-full" rows={3} value={form.plan} onChange={(e) => setForm({ ...form!, plan: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Pendientes</label>
                    <textarea className="border rounded p-2 w-full" rows={3} value={form.pendientes} onChange={(e) => setForm({ ...form!, pendientes: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-inherit pt-2">
              <div className="flex gap-2 justify-end border-t pt-3">
                <button className="px-3 py-1 rounded border btn-soft" onClick={onClose}>Cancelar</button>
                <button className="px-3 py-1 rounded border btn-success" onClick={async () => { if (form?.id) await onSave(form.id, form) }}>Guardar</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

