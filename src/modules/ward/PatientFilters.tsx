import React from 'react'
import type { WardQuery } from '../../types/ward'

type Props = {
  query: WardQuery
  onChange: (patch: Partial<WardQuery>) => void
}

export default function PatientFilters({ query, onChange }: Props) {
  return (
    <div className="card">
      <div className="card-body flex flex-wrap items-center gap-2">
        <input className="px-3 py-2 border rounded min-w-[240px]" placeholder="Buscar nombre / DNI / cama" value={query.search || ''} onChange={(e)=> onChange({ search: e.target.value, page: 1 })} />
        <select className="px-3 py-2 border rounded" value={query.servicio || ''} onChange={(e)=> onChange({ servicio: e.target.value || undefined, page: 1 })}>
          <option value="">Servicio: todos</option>
          <option value="Sala">Sala</option>
          <option value="UCI">UCI</option>
          <option value="Guardia">Guardia</option>
        </select>
        <select className="px-3 py-2 border rounded" value={query.severidad || 'all'} onChange={(e)=> onChange({ severidad: (e.target.value as any), page: 1 })}>
          <option value="all">Severidad: todas</option>
          <option value="I">I</option>
          <option value="II">II</option>
          <option value="III">III</option>
          <option value="IV">IV</option>
        </select>
        <select className="px-3 py-2 border rounded" value={query.status || 'all'} onChange={(e)=> onChange({ status: (e.target.value as any), page: 1 })}>
          <option value="all">Estado: todos</option>
          <option value="activo">Activo</option>
          <option value="alta">Alta</option>
          <option value="archivado">Archivado</option>
        </select>
        <select className="px-3 py-2 border rounded" value={query.pageSize || 20} onChange={(e)=> onChange({ pageSize: Number(e.target.value), page: 1 })}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>
    </div>
  )
}
