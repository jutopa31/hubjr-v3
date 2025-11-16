import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Clock, AlertCircle, CheckCircle, Trash2, Edit3, Save, X, Filter, Calendar, Users } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { syncAllPendientes, completeTaskAndClearPatientPendientes } from '../utils/pendientesSync';
import { useAuthContext } from './auth/AuthProvider';

interface Task {
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

const PendientesManager: React.FC = () => {
  const { user } = useAuthContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [_editingTask, setEditingTask] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<Task>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    due_date: ''
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.dataset.section = 'patients';
    }
    return () => { if (typeof document !== 'undefined') delete (document.body as any).dataset.section };
  }, []);

  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: tasks, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          setError('La tabla de tareas no está configurada.');
          setTasks([]);
        } else if (error.code === '42501') {
          setError('Sin permisos para acceder a las tareas. Verifique las políticas RLS.');
        } else {
          setError(`Error al cargar tareas: ${error.message}`);
        }
      } else {
        setTasks(tasks || []);
      }
    } catch (err) {
      console.error('Error al obtener tareas:', err);
      setError('Error de conexión al cargar las tareas');
      setTasks([]);
    }
    setLoading(false);
  };

  const handleSyncWithWardRounds = async () => {
    setSyncing(true);
    try {
      const success = await syncAllPendientes();
      if (success) {
        await fetchTasks();
        alert('Sincronización completada exitosamente');
      } else {
        alert('Error durante la sincronización');
      }
    } catch (error) {
      console.error('Error syncing:', error);
      alert('Error durante la sincronización');
    } finally {
      setSyncing(false);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('tasks').insert([{ ...newTask, created_at: new Date().toISOString(), source: 'manual' }]);
      if (error) throw error;
      setShowForm(false);
      setNewTask({ title: '', description: '', priority: 'medium', status: 'pending', due_date: '' });
      await fetchTasks();
    } catch (err: any) {
      alert('Error al crear tarea: ' + (err?.message || ''));
    } finally {
      setLoading(false);
    }
  }

  const completeTask = async (id: string) => {
    try {
      const ok = await completeTaskAndClearPatientPendientes(id, true);
      if (ok) await fetchTasks();
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => { fetchTasks(); }, [user?.id]);

  const filtered = tasks.filter(t =>
    (filterStatus === 'all' || t.status === filterStatus) &&
    (filterPriority === 'all' || t.priority === filterPriority) &&
    (filterSource === 'all' || (t.source || 'manual') === filterSource)
  )

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Pendientes</h2>
        <div className="flex gap-2">
          <button className="btn-soft px-3 py-1 rounded border" onClick={()=>setShowForm(v=>!v)}><Plus className="inline h-4 w-4 mr-1"/>Nueva</button>
          <button className="btn-soft px-3 py-1 rounded border disabled:opacity-50" disabled={syncing} onClick={handleSyncWithWardRounds}>Sincronizar con Pase</button>
          <button className="btn-soft px-3 py-1 rounded border" onClick={fetchTasks}>Refrescar</button>
        </div>
      </header>

      {showForm && (
        <form onSubmit={createTask} className="border rounded p-3 grid grid-cols-1 md:grid-cols-3 gap-2">
          <input className="border rounded p-2" placeholder="Titulo" value={newTask.title} onChange={(e)=> setNewTask({...newTask, title:e.target.value})} />
          <select className="border rounded p-2" value={newTask.priority} onChange={(e)=> setNewTask({...newTask, priority:e.target.value as any})}>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
          <select className="border rounded p-2" value={newTask.status} onChange={(e)=> setNewTask({...newTask, status:e.target.value as any})}>
            <option value="pending">Pendiente</option>
            <option value="in_progress">En progreso</option>
            <option value="completed">Completada</option>
          </select>
          <input className="border rounded p-2 md:col-span-3" placeholder="Descripcion" value={newTask.description} onChange={(e)=> setNewTask({...newTask, description:e.target.value})} />
          <div className="md:col-span-3 flex gap-2">
            <button className="px-3 py-1 rounded border btn-success" type="submit">Guardar</button>
            <button className="px-3 py-1 rounded border btn-soft" type="button" onClick={()=> setShowForm(false)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-2">Titulo</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Origen</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-t">
                <td className="p-2">{t.title}</td>
                <td>{t.priority}</td>
                <td>{t.status}</td>
                <td>{t.source || 'manual'}</td>
                <td className="text-right pr-2">
                  {t.status !== 'completed' && (
                    <button className="px-2 py-1 border rounded" onClick={()=> completeTask(t.id!)}>
                      <CheckSquare className="inline h-4 w-4"/> Completar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <div className="banner p-3 text-sm">{error}</div>}
    </section>
  )
}

export default PendientesManager;

