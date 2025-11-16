import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

interface ClassEvent {
  id?: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  speaker?: string;
  location?: string;
  description?: string;
}

export default function ClasesScheduler({ isAdminMode = false }: { isAdminMode?: boolean }) {
  const [items, setItems] = useState<ClassEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<ClassEvent>({ title: '', date: '', time: '', speaker: '', location: '', description: '' });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('academic_classes').select('*').order('date', { ascending: true });
      if (error) throw error;
      setItems(data || []);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('academic_classes').insert([{ ...draft }]);
      if (error) throw error;
      setShowForm(false);
      setDraft({ title: '', date: '', time: '', speaker: '', location: '', description: '' });
      await fetchItems();
    } catch (e: any) {
      alert('Error guardando clase: ' + (e?.message||''));
    } finally { setLoading(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar clase?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('academic_classes').delete().eq('id', id);
      if (error) throw error;
      await fetchItems();
    } catch (e: any) {
      alert('Error eliminando: ' + (e?.message||''));
    } finally { setLoading(false); }
  };

  useEffect(()=>{ fetchItems(); },[]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Clases y Actividades</h3>
        {isAdminMode && <button className="px-3 py-1 border rounded" onClick={()=> setShowForm(v=>!v)}>Nueva</button>}
      </div>

      {showForm && (
        <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-3 gap-2 border rounded p-3 my-3">
          <input className="border rounded p-2" placeholder="Titulo" value={draft.title} onChange={(e)=> setDraft({...draft, title:e.target.value})} />
          <input className="border rounded p-2" type="date" value={draft.date} onChange={(e)=> setDraft({...draft, date:e.target.value})} />
          <input className="border rounded p-2" type="time" value={draft.time} onChange={(e)=> setDraft({...draft, time:e.target.value})} />
          <input className="border rounded p-2" placeholder="Orador" value={draft.speaker} onChange={(e)=> setDraft({...draft, speaker:e.target.value})} />
          <input className="border rounded p-2" placeholder="Lugar" value={draft.location} onChange={(e)=> setDraft({...draft, location:e.target.value})} />
          <input className="border rounded p-2 md:col-span-3" placeholder="Descripcion" value={draft.description} onChange={(e)=> setDraft({...draft, description:e.target.value})} />
          <div className="md:col-span-3 flex gap-2">
            <button className="px-3 py-1 rounded border btn-success" type="submit">Guardar</button>
            <button className="px-3 py-1 rounded border btn-soft" type="button" onClick={()=> setShowForm(false)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="divide-y">
        {items.map(it => (
          <div key={it.id} className="py-2 flex items-center justify-between">
            <div>
              <div className="font-medium">{it.title}</div>
              <div className="text-sm text-gray-600">{it.date} {it.time} • {it.location}</div>
            </div>
            {isAdminMode && <button className="px-2 py-1 border rounded" onClick={()=> remove(it.id!)}>Eliminar</button>}
          </div>
        ))}
      </div>
    </div>
  )
}

