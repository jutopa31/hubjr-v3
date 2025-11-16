export type Severity = 'I' | 'II' | 'III' | 'IV'
export type WardStatus = 'activo' | 'alta' | 'archivado'

export interface WardPatient {
  id?: string
  fecha: string
  nombre: string
  dni: string
  edad: string
  sexo?: string
  cama: string
  servicio?: string
  unidad?: string
  motivo_consulta: string
  examen_fisico: string
  estudios: string
  diagnostico: string
  severidad: Severity
  plan: string
  pendientes: string
  status?: WardStatus
  prioridad?: 'low'|'medium'|'high'
  assigned_resident_id?: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface ResidentProfile {
  id: string
  email: string
  full_name: string
  role: string
}

export interface WardQuery {
  search?: string
  servicio?: string
  severidad?: Severity | 'all'
  status?: WardStatus | 'all'
  assigned?: 'me' | 'all'
  page?: number
  pageSize?: number
  sortBy?: keyof WardPatient
  sortDir?: 'asc' | 'desc'
}

export interface WardResponse { data: WardPatient[]; total: number; error?: string }

