import { supabase } from './supabase';

export type AdminPrivilegeType =
  | 'hospital_context_access'
  | 'full_admin'
  | 'lumbar_puncture_admin'
  | 'scale_management'
  | 'user_management';

export async function hasAdminPrivilege(
  userEmail: string,
  privilegeType: AdminPrivilegeType
): Promise<{ success: boolean; hasPrivilege: boolean; error?: string }>{
  try {
    const { data, error } = await supabase.rpc('has_admin_privilege', {
      user_email_param: userEmail,
      privilege_type_param: privilegeType,
    });
    if (error) {
      return { success: false, hasPrivilege: false, error: error.message };
    }
    // The RPC is expected to return a boolean
    return { success: true, hasPrivilege: Boolean(data) };
  } catch (e: any) {
    return { success: false, hasPrivilege: false, error: e?.message || 'RPC error' };
  }
}

type WardRoundPatient = {
  id?: string;
  cama: string;
  dni: string;
  nombre: string;
  edad: string;
  antecedentes: string;
  motivo_consulta: string;
  examen_fisico: string;
  estudios: string;
  severidad: string;
  diagnostico: string;
  plan: string;
  pendientes: string;
  fecha: string;
}

export async function archiveWardPatient(
  wardPatient: WardRoundPatient,
  hospitalContext: 'Posadas' | 'Julian' = 'Posadas'
): Promise<{ success: boolean; data?: any; error?: string; duplicate?: boolean }>{
  try {
    // Check duplicate by DNI
    const { data: existing, error: dupError } = await supabase
      .from('diagnostic_assessments')
      .select('id, patient_name')
      .eq('patient_dni', wardPatient.dni)
      .limit(1)
      .maybeSingle();

    if (dupError) {
      // continue — maybe table doesn't exist; let insert surface the real error
      console.warn('Duplicate check error:', dupError.message);
    }
    if (existing) {
      return { success: false, duplicate: true, error: `Ya existe un paciente archivado con DNI ${wardPatient.dni}. Nombre: ${existing.patient_name}` };
    }

    // Build clinical notes summary
    const clinical_notes = [
      `Cama: ${wardPatient.cama}`,
      `Motivo: ${wardPatient.motivo_consulta}`,
      `Examen: ${wardPatient.examen_fisico}`,
      `Estudios: ${wardPatient.estudios}`,
      `Dx: ${wardPatient.diagnostico}`,
      `Plan: ${wardPatient.plan}`,
      `Pendientes: ${wardPatient.pendientes}`
    ].join('\n');

    const payload = {
      patient_name: wardPatient.nombre,
      patient_age: wardPatient.edad,
      patient_dni: wardPatient.dni,
      clinical_notes,
      scale_results: [],
      hospital_context: hospitalContext,
      created_by: 'ward_archive',
      status: 'active'
    };

    const { data, error } = await supabase
      .from('diagnostic_assessments')
      .insert([payload])
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Unexpected error' };
  }
}

