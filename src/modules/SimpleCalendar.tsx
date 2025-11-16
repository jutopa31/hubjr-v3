import React, { useState, useEffect } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface MedicalEvent {
  id?: string;
  title: string;
  start_date: string;
  end_date: string;
  type?: string;
  location?: string;
  description?: string;
}

const SimpleCalendar: React.FC = () => {
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState<MedicalEvent>({
    title: '',
    start_date: '',
    end_date: '',
    type: 'clinical',
    location: '',
    description: ''
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: events, error } = await supabase
        .from('medical_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch error:', error);
        if (error.code === 'PGRST116') {
          alert('Tabla medical_events vacía o inexistente');
        }
      } else {
        setEvents(events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.start_date || !newEvent.end_date) {
      alert('Completa titulo, inicio y fin');
      return;
    }
    setLoading(true);
    try {
      const eventData = {
        title: newEvent.title.trim(),
        start_date: newEvent.start_date,
        end_date: newEvent.end_date,
        type: newEvent.type || 'clinical',
        location: newEvent.location?.trim() || '',
        description: newEvent.description?.trim() || '',
        created_by: 'res_chief_julian'
      };
      const { error } = await supabase.from('medical_events').insert([eventData]);
      if (error) throw error;
      setNewEvent({ title: '', start_date: '', end_date: '', type: 'clinical', location: '', description: '' });
      setShowForm(false);
      await fetchEvents();
    } catch (error: any) {
      alert('Error al crear evento: ' + (error?.message||''));
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('¿Eliminar evento?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('medical_events').delete().eq('id', id);
      if (error) throw error;
      await fetchEvents();
    } catch (error: any) {
      alert('Error al eliminar evento: ' + (error?.message||''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Calendario Médico</h2>
        </div>
        <button onClick={()=> setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors" disabled={loading}>
          <Plus className="w-4 h-4" /> Nuevo Evento
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Crear Evento Rápido</h3>
          <form onSubmit={createEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input type="text" value={newEvent.title} onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} className="w-full p-2 border border-gray-300 rounded" placeholder="Ej: Rounds Matutinos" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={newEvent.type} onChange={(e) => setNewEvent({...newEvent, type: e.target.value})} className="w-full p-2 border border-gray-300 rounded">
                  <option value="clinical">Clínico</option>
                  <option value="academic">Académico</option>
                  <option value="administrative">Administrativo</option>
                  <option value="social">Social</option>
                  <option value="emergency">Emergencia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora Inicio *</label>
                <input type="datetime-local" value={newEvent.start_date} onChange={(e) => setNewEvent({...newEvent, start_date: e.target.value})} className="w-full p-2 border border-gray-300 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora Fin *</label>
                <input type="datetime-local" value={newEvent.end_date} onChange={(e) => setNewEvent({...newEvent, end_date: e.target.value})} className="w-full p-2 border border-gray-300 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                <input type="text" value={newEvent.location} onChange={(e) => setNewEvent({...newEvent, location: e.target.value})} className="w-full p-2 border border-gray-300 rounded" placeholder="Ej: Sala de Neurología" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input type="text" value={newEvent.description} onChange={(e) => setNewEvent({...newEvent, description: e.target.value})} className="w-full p-2 border border-gray-300 rounded" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Guardar</button>
              <button type="button" onClick={()=> setShowForm(false)} className="px-4 py-2 rounded border">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {events.map(e => (
          <div key={e.id} className="border rounded p-3">
            <div className="font-medium">{e.title} <span className="text-xs text-gray-500 ml-2">{e.type}</span></div>
            <div className="text-sm text-gray-600">{new Date(e.start_date).toLocaleString()} → {new Date(e.end_date).toLocaleString()}</div>
            {e.location && <div className="text-sm text-gray-600">{e.location}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleCalendar;

