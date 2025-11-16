// Minimal Ward Rounds module (fork)
import React, { useState, useEffect } from 'react';
import { Plus, Download, Edit, Save, X, ChevronUp, ChevronDown, ChevronRight, Check, User, Clipboard, Stethoscope, FlaskConical, Target, CheckCircle, Trash2, Users } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { createOrUpdateTaskFromPatient } from '../utils/pendientesSync';
import { archiveWardPatient } from '../utils/diagnosticAssessmentDB';
import DeletePatientModal from '../components/DeletePatientModal';
import { useAuthContext } from '../modules/auth/AuthProvider';
import { robustQuery, formatQueryError } from '../utils/queryHelpers';
import { LoadingWithRecovery } from '../components/LoadingWithRecovery';

interface Patient {
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
  assigned_resident_id?: string;
}

interface ResidentProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

const WardRounds: React.FC = () => {
  const { user, loading: authLoading } = useAuthContext();
  const ENABLE_DNI_CHECK = false;
  const emptyPatient: Patient = {
    cama: '',
    dni: '',
    nombre: '',
    edad: '',
    antecedentes: '',
    motivo_consulta: '',
    examen_fisico: '',
    estudios: '',
    severidad: '',
    diagnostico: '',
    plan: '',
    pendientes: '',
    fecha: new Date().toISOString().split('T')[0],
    assigned_resident_id: undefined
  };

  const [patients, setPatients] = useState<Patient[]>([]);
  const [residents, setResidents] = useState<ResidentProfile[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient>(emptyPatient);
  const [newPatient, setNewPatient] = useState<Patient>(emptyPatient);
  const [loading, setLoading] = useState(true);

  const [sortField, setSortField] = useState<keyof Patient | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingPendientesId, setEditingPendientesId] = useState<string | null>(null);
  const [tempPendientes, setTempPendientes] = useState<string>('');
  const [dniError, setDniError] = useState<string>('');
  const [isDniChecking, setIsDniChecking] = useState(false);
  const dniValidationTimeout = React.useRef<number | null>(null);
  const [isSavingNewPatient, setIsSavingNewPatient] = useState(false);
  const [isUpdatingPatient, setIsUpdatingPatient] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPatientForDeletion, setSelectedPatientForDeletion] = useState<{ id: string; nombre: string; dni: string } | null>(null);
  const [isProcessingDeletion, setIsProcessingDeletion] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.dataset.section = 'patients';
    }
    return () => {
      if (typeof document !== 'undefined') {
        delete (document.body as any).dataset.section;
      }
    };
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

  const loadData = async () => {
    await Promise.all([loadPatients(), loadResidents()]);
  };

  const loadPatients = async () => {
    try {
      const { data, error }: any = await robustQuery(
        () => supabase.from('ward_round_patients').select('*').order('created_at', { ascending: false }),
        { timeout: 8000, retries: 2, operationName: 'loadPatients' }
      );
      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResidents = async () => {
    try {
      const { data, error }: any = await robustQuery(
        () => supabase.from('resident_profiles').select('id,email,full_name,role').order('full_name'),
        { timeout: 8000, retries: 2, operationName: 'loadResidents' }
      );
      if (!error) setResidents(data || []);
    } catch {
      // non-blocking
    }
  };

  const addPatient = async () => {
    if (isSavingNewPatient) return;
    setIsSavingNewPatient(true);
    try {
      const { data, error } = await supabase.from('ward_round_patients').insert([newPatient]).select();
      if (error) throw error;
      setPatients((p) => [data?.[0], ...p]);
      setShowAddForm(false);
      setNewPatient(emptyPatient);
    } catch (error) {
      console.error('Error adding patient:', error);
      alert('Error agregando paciente');
    } finally {
      setIsSavingNewPatient(false);
    }
  };

  const updatePatient = async (id: string, updated: Partial<Patient>) => {
    if (isUpdatingPatient) return;
    setIsUpdatingPatient(true);
    try {
      const { data, error } = await supabase.from('ward_round_patients').update(updated).eq('id', id).select();
      if (error) throw error;
      setPatients((list) => list.map((p) => (p.id === id ? { ...p, ...updated } as Patient : p)));
      // Sync pendientes to tasks
      if (updated.pendientes !== undefined) {
        const full = patients.find((p) => p.id === id);
        if (full) await createOrUpdateTaskFromPatient({ ...full, pendientes: updated.pendientes });
      }
    } catch (error: any) {
      console.error('Error updating patient:', error);
      alert('No se pudo actualizar el paciente: ' + (error?.message || ''));
    } finally {
      setIsUpdatingPatient(false);
    }
  };

  const askDeleteOrArchive = (patient: { id: string; nombre: string; dni: string }) => {
    setSelectedPatientForDeletion(patient);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (action: 'delete' | 'archive') => {
    if (!selectedPatientForDeletion) return;
    setIsProcessingDeletion(true);
    try {
      const { id, nombre } = selectedPatientForDeletion;
      if (action === 'archive') {
        const { data, error } = await supabase.from('ward_round_patients').select('*').eq('id', id).single();
        if (error) throw error;
        const result = await archiveWardPatient(data, 'Posadas');
        if (!result.success) throw new Error(result.error || 'Archive failed');
      }
      await supabase.from('tasks').delete().eq('patient_id', id);
      await supabase.from('ward_round_patients').delete().eq('id', id);
      setPatients((list) => list.filter((p) => p.id !== id));
      setShowDeleteModal(false);
      setSelectedPatientForDeletion(null);
    } catch (e: any) {
      console.error('Deletion error:', e);
      alert('Error eliminando paciente: ' + (e?.message || ''));
    } finally {
      setIsProcessingDeletion(false);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    })
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Pase de sala</h2>
        <div className="flex gap-2">
          <button className="btn-soft px-3 py-1 rounded border" onClick={()=>setShowAddForm((v)=>!v)}>
            <Plus className="inline h-4 w-4 mr-1"/> Nuevo
          </button>
          <button className="btn-soft px-3 py-1 rounded border" onClick={loadData}>
            Refrescar
          </button>
        </div>
      </header>

      <LoadingWithRecovery isLoading={loading} onRetry={loadData} loadingMessage="Cargando pacientes...">
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="p-2">Paciente</th>
                <th>Cama</th>
                <th>Edad</th>
                <th>Severidad</th>
                <th>Pendientes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p)=> (
                <tr key={p.id} className="border-t">
                  <td className="p-2 font-medium">{p.nombre}</td>
                  <td>{p.cama}</td>
                  <td>{p.edad}</td>
                  <td>{p.severidad}</td>
                  <td className="max-w-[360px]">
                    <textarea className="w-full border rounded p-1" rows={2} value={p.pendientes}
                      onChange={(e)=> setPatients((list)=> list.map(x=> x.id===p.id?{...x, pendientes:e.target.value}:x))}
                      onBlur={()=> updatePatient(p.id!, { pendientes: p.pendientes })}
                    />
                  </td>
                  <td className="text-right pr-2">
                    <button className="px-2 py-1 border rounded mr-2" onClick={()=> askDeleteOrArchive({ id: p.id!, nombre: p.nombre, dni: p.dni })}>
                      <Trash2 className="inline h-4 w-4"/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LoadingWithRecovery>

      {showAddForm && (
        <div className="border rounded p-3 bg-gray-50">
          <h3 className="font-semibold mb-2">Nuevo paciente</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input className="border rounded p-2" placeholder="Nombre" value={newPatient.nombre} onChange={(e)=> setNewPatient({...newPatient, nombre:e.target.value})} />
            <input className="border rounded p-2" placeholder="DNI" value={newPatient.dni} onChange={(e)=> setNewPatient({...newPatient, dni:e.target.value})} />
            <input className="border rounded p-2" placeholder="Cama" value={newPatient.cama} onChange={(e)=> setNewPatient({...newPatient, cama:e.target.value})} />
            <input className="border rounded p-2" placeholder="Edad" value={newPatient.edad} onChange={(e)=> setNewPatient({...newPatient, edad:e.target.value})} />
            <input className="border rounded p-2" placeholder="Severidad" value={newPatient.severidad} onChange={(e)=> setNewPatient({...newPatient, severidad:e.target.value})} />
            <textarea className="border rounded p-2 md:col-span-3" placeholder="Pendientes" value={newPatient.pendientes} onChange={(e)=> setNewPatient({...newPatient, pendientes:e.target.value})} />
          </div>
          <div className="flex gap-2 mt-3">
            <button disabled={isSavingNewPatient} className="px-3 py-1 rounded border btn-success" onClick={addPatient}>Guardar</button>
            <button className="px-3 py-1 rounded border btn-soft" onClick={()=> setShowAddForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <DeletePatientModal
        isOpen={showDeleteModal}
        onClose={()=> setShowDeleteModal(false)}
        patient={selectedPatientForDeletion}
        onConfirmDelete={handleConfirmDelete}
        isProcessing={isProcessingDeletion}
      />
    </section>
  );
};

export default WardRounds;
