// Minimal Ward Rounds module (fork)
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAuthContext } from '../modules/auth/AuthProvider';
import { LoadingWithRecovery } from '../components/LoadingWithRecovery';
import DeletePatientModal from '../components/DeletePatientModal';
import PatientFilters from './ward/PatientFilters';
import PatientDrawer from './ward/PatientDrawer';
import PatientFormModal from './ward/PatientFormModal';
import { createOrUpdateTaskFromPatient } from '../utils/pendientesSync';
import { archiveWardPatient } from '../utils/diagnosticAssessmentDB';
import { fetchResidents, fetchWardPatients, createWardPatient, updateWardPatient, deleteWardPatient } from '../services/wardRounds';
import type { WardPatient, WardQuery, ResidentProfile } from '../types/ward'

const WardRounds: React.FC = () => {
  const { user, loading: authLoading } = useAuthContext();
  const [query, setQuery] = useState<WardQuery>({ page: 1, pageSize: 20, sortBy: 'created_at', sortDir: 'desc', severidad: 'all', status: 'all' })
  const [data, setData] = useState<{ rows: WardPatient[]; total: number; error?: string }>({ rows: [], total: 0 })
  const [residents, setResidents] = useState<ResidentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected, setSelected] = useState<WardPatient | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { if (!authLoading) loadAll() }, [authLoading, JSON.stringify(query)])

  async function loadAll() {
    setLoading(true)
    const [resP, resR] = await Promise.all([fetchWardPatients(query), fetchResidents()])
    setData({ rows: resP.data, total: resP.total, error: resP.error })
    setResidents(resR)
    setLoading(false)
  }

  const onCreate = async (p: WardPatient) => {
    const { ok, id, error } = await createWardPatient(p)
    if (!ok) return alert(error)
    await loadAll()
    if (id) {
      const row = { ...p, id }
      setSelected(row)
      setDrawerOpen(true)
    }
  }

  const onSave = async (id: string, patch: Partial<WardPatient>) => {
    const { ok, error } = await updateWardPatient(id, patch)
    if (!ok) return alert(error)
    await loadAll()
    if (patch.pendientes !== undefined) {
      const full = data.rows.find(r => r.id === id)
      if (full) await createOrUpdateTaskFromPatient({ ...full, pendientes: patch.pendientes })
    }
  }

  const askDeleteOrArchive = (patient: WardPatient) => { setSelected(patient); setShowDeleteModal(true) }
  const onConfirmDelete = async (action: 'delete' | 'archive') => {
    if (!selected?.id) return
    setDeleting(true)
    try {
      if (action === 'archive') {
        const result = await archiveWardPatient(selected, 'Posadas')
        if (!result.success) throw new Error(result.error || 'Archive failed')
      }
      await deleteWardPatient(selected.id)
      await loadAll()
      setShowDeleteModal(false)
      setSelected(null)
    } catch (e: any) { alert(e?.message || 'Error') }
    finally { setDeleting(false) }
  }

  const pageCount = useMemo(() => Math.ceil((data.total || 0) / (query.pageSize || 20)), [data.total, query.pageSize])
  const rangeText = useMemo(()=>{
    const p = query.page ?? 1; const ps = query.pageSize ?? 20; const total = data.total||0
    const start = total === 0 ? 0 : (p - 1) * ps + 1
    const end = Math.min(total, p * ps)
    return `Mostrando ${start}-${end} de ${total}`
  }, [query.page, query.pageSize, data.total])

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Pase de sala</h2>
        <div className="flex gap-2">
          <button className="btn-soft px-3 py-1 rounded border" onClick={()=> setShowCreate(true)}><Plus className="inline h-4 w-4 mr-1"/>Nuevo</button>
          <button className="btn-soft px-3 py-1 rounded border" onClick={loadAll}>Refrescar</button>
        </div>
      </header>
      <PatientFilters query={query} onChange={(patch)=> setQuery((q)=> ({ ...q, ...patch }))} />

      <LoadingWithRecovery isLoading={loading} onRetry={loadAll} loadingMessage="Cargando pacientes...">
        <div className="card overflow-x-auto">
          <div className="card-body p-0 max-h-[70vh] overflow-y-auto">
          <table className="table">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="p-2">Paciente</th>
                <th>DNI</th>
                <th>Cama</th>
                <th>Edad</th>
                <th>Severidad</th>
                <th>Diagnóstico</th>
                <th className="w-[380px]">Pendientes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((p)=> (
                <tr key={p.id} className="border-t hover:bg-gray-50 dark:hover:bg-[#161616]">
                  <td className="p-2 font-medium cursor-pointer" onClick={()=> { setSelected(p); setDrawerOpen(true) }}>{p.nombre}</td>
                  <td>{p.dni}</td>
                  <td>
                    <input className="border rounded px-2 py-1 w-24" value={p.cama}
                      onChange={(e)=> setData(d=> ({...d, rows: d.rows.map(x=> x.id===p.id? {...x, cama:e.target.value}: x)}))}
                      onBlur={()=> onSave(p.id!, { cama: p.cama })}
                    />
                  </td>
                  <td>{p.edad}</td>
                  <td><span className={`badge ${p.severidad==='IV'?'badge-red': p.severidad==='III'?'badge-amber':'badge-gray'}`}>{p.severidad}</span></td>
                  <td className="max-w-[280px] whitespace-nowrap overflow-hidden text-ellipsis">{p.diagnostico || '—'}</td>
                  <td>
                    <textarea className="w-full border rounded p-1" rows={2} value={p.pendientes}
                      onChange={(e)=> setData(d=> ({...d, rows: d.rows.map(x=> x.id===p.id? {...x, pendientes:e.target.value}: x)}))}
                      onBlur={()=> onSave(p.id!, { pendientes: p.pendientes })}
                    />
                  </td>
                  <td className="text-right pr-2">
                    <button className="px-2 py-1 border rounded" onClick={()=> askDeleteOrArchive(p)}><Trash2 className="inline h-4 w-4"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-600">{rangeText}</div>
          <div className="flex gap-2">
            <button className="px-2 py-1 border rounded disabled:opacity-50" disabled={(query.page ?? 1) <= 1} onClick={()=> setQuery(q=> ({...q, page: Math.max(1, (q.page ?? 1) - 1)}))}>Prev</button>
            <button className="px-2 py-1 border rounded disabled:opacity-50" disabled={(query.page ?? 1) >= (pageCount || 1)} onClick={()=> setQuery(q=> ({...q, page: (q.page ?? 1) + 1}))}>Next</button>
          </div>
        </div>
      </LoadingWithRecovery>

      <PatientFormModal open={showCreate} onClose={()=> setShowCreate(false)} onCreate={onCreate} />

      <PatientDrawer open={drawerOpen} onClose={()=> setDrawerOpen(false)} patient={selected} onSave={onSave} residents={residents} />

      <DeletePatientModal isOpen={showDeleteModal} onClose={()=> setShowDeleteModal(false)} patient={selected? { id: selected.id!, nombre: selected.nombre, dni: selected.dni } : null} onConfirmDelete={onConfirmDelete} isProcessing={deleting} />
    </section>
  )
}

export default WardRounds;
