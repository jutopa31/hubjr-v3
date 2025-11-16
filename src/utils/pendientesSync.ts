import { supabase } from './supabase';

export interface Patient {
  id?: string;
  nombre: string;
  dni: string;
  cama: string;
  severidad: string;
  pendientes: string;
}

export interface Task {
  id?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  due_date?: string;
  patient_id?: string;
  source?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export const severityToPriority = (severidad: string): 'low' | 'medium' | 'high' => {
  switch (severidad) {
    case 'IV': return 'high';
    case 'III': return 'medium';
    case 'II':
    case 'I':
    default: return 'low';
  }
};

export const createOrUpdateTaskFromPatient = async (patient: Patient): Promise<boolean> => {
  if (!patient.pendientes || !patient.pendientes.trim()) {
    await markPatientTaskAsCompleted(patient.id || '');
    return true;
  }
  try {
    const { data: existingTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('patient_id', patient.id)
      .eq('source', 'ward_rounds');
    if (fetchError) { console.error('Error fetching existing tasks:', fetchError); return false; }
    const taskData = {
      title: `${patient.nombre} (${patient.cama}) - Pendientes`,
      description: patient.pendientes,
      priority: severityToPriority(patient.severidad),
      status: 'pending' as const,
      patient_id: patient.id,
      source: 'ward_rounds',
      updated_at: new Date().toISOString()
    };
    if (existingTasks && existingTasks.length > 0) {
      const { error: updateError } = await supabase.from('tasks').update(taskData).eq('id', existingTasks[0].id);
      if (updateError) { console.error('Error updating task:', updateError); return false; }
    } else {
      const { error: insertError } = await supabase.from('tasks').insert([{ ...taskData, created_at: new Date().toISOString() }]);
      if (insertError) { console.error('Error creating task:', insertError); return false; }
    }
    return true;
  } catch (error) {
    console.error('Error in createOrUpdateTaskFromPatient:', error);
    return false;
  }
};

export const markPatientTaskAsCompleted = async (patientId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('patient_id', patientId)
      .eq('source', 'ward_rounds')
      .eq('status', 'pending');
    if (error) { console.error('Error marking task as completed:', error); return false; }
    return true;
  } catch (error) { console.error('Error in markPatientTaskAsCompleted:', error); return false; }
};

export const syncAllPendientes = async (): Promise<boolean> => {
  try {
    const { data: patients, error: patientsError } = await supabase
      .from('ward_round_patients')
      .select('id, nombre, dni, cama, severidad, pendientes');
    if (patientsError) { console.error('Error fetching patients:', patientsError); return false; }
    if (!patients || patients.length === 0) return true;
    const results = await Promise.all(patients.map(patient => createOrUpdateTaskFromPatient(patient)));
    return results.every(Boolean);
  } catch (error) {
    console.error('Error in syncAllPendientes:', error); return false;
  }
};

export const completeTaskAndClearPatientPendientes = async (taskId: string, clearPatientPendientes: boolean = true): Promise<boolean> => {
  try {
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('patient_id, source')
      .eq('id', taskId)
      .single();
    if (fetchError) { console.error('Error fetching task:', fetchError); return false; }
    if (!task || task.source !== 'ward_rounds') {
      const { error: updateError } = await supabase.from('tasks').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', taskId);
      return !updateError;
    }
    const { error: taskUpdateError } = await supabase.from('tasks').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', taskId);
    if (taskUpdateError) { console.error('Error updating task status:', taskUpdateError); return false; }
    if (clearPatientPendientes && (task as any).patient_id) {
      const { error: patientUpdateError } = await supabase.from('ward_round_patients').update({ pendientes: '' }).eq('id', (task as any).patient_id);
      if (patientUpdateError) { console.error('Error clearing patient pendientes:', patientUpdateError); return false; }
    }
    return true;
  } catch (error) { console.error('Error in completeTaskAndClearPatientPendientes:', error); return false; }
};

