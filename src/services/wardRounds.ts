import { supabase } from '../utils/supabase'
import type { WardPatient, WardQuery, WardResponse, ResidentProfile } from '../types/ward'

export async function fetchWardPatients(q: WardQuery = {}): Promise<WardResponse> {
  const { page = 1, pageSize = 20, search, servicio, severidad, status, sortBy = 'created_at', sortDir = 'desc' } = q
  try {
    let req = supabase.from('ward_round_patients').select('*', { count: 'exact' })
    if (search && search.trim()) {
      const s = `%${search.trim()}%`
      req = req.or(`nombre.ilike.${s},dni.ilike.${s},cama.ilike.${s}`)
    }
    if (servicio) req = req.eq('servicio', servicio)
    if (severidad && severidad !== 'all') req = req.eq('severidad', severidad)
    if (status && status !== 'all') req = req.eq('status', status)
    req = req.order(sortBy as string, { ascending: sortDir === 'asc' })
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    const { data, count, error } = await req.range(from, to)
    if (error) return { data: [], total: 0, error: error.message }
    return { data: (data || []) as WardPatient[], total: count || 0 }
  } catch (e: any) {
    return { data: [], total: 0, error: e?.message || 'Unknown error' }
  }
}

export async function fetchResidents(): Promise<ResidentProfile[]> {
  try {
    const { data, error } = await supabase
      .from('resident_profiles')
      .select('id,email,full_name,role')
      .order('full_name')
    if (error) return []
    return (data || []) as ResidentProfile[]
  } catch { return [] }
}

export async function createWardPatient(p: WardPatient): Promise<{ ok: boolean; id?: string; error?: string }>{
  try {
    const { data, error } = await supabase.from('ward_round_patients').insert([p]).select().single()
    if (error) return { ok: false, error: error.message }
    return { ok: true, id: data?.id }
  } catch (e: any) { return { ok: false, error: e?.message || 'Error' } }
}

export async function updateWardPatient(id: string, patch: Partial<WardPatient>): Promise<{ ok: boolean; error?: string }>{
  try {
    const { error } = await supabase.from('ward_round_patients').update(patch).eq('id', id)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e?.message || 'Error' } }
}

export async function deleteWardPatient(id: string): Promise<{ ok: boolean; error?: string }>{
  try {
    const { error } = await supabase.from('ward_round_patients').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e?.message || 'Error' } }
}

