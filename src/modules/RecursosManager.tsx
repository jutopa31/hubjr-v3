import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

interface AcademicResource {
  id?: string;
  title: string;
  category: string;
  resource_type: 'guia'|'paper'|'video'|'otro';
  google_drive_url?: string;
  description?: string;
  tags?: string[];
  difficulty_level?: 'basico'|'intermedio'|'avanzado';
  estimated_time?: number;
  language?: 'es'|'en';
  author?: string;
  publication_year?: number;
  is_featured?: boolean;
  view_count?: number;
}

export default function RecursosManager({ isAdminMode=false }: { isAdminMode?: boolean }) {
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<string | null>(null);
  const [newResource, setNewResource] = useState<AcademicResource>({
    title: '', category: 'neuroanatomia', resource_type: 'guia', description: '', tags: [], difficulty_level: 'basico', estimated_time: 30, language: 'es', author: '', publication_year: new Date().getFullYear(), is_featured: false
  });
  const [tagInput, setTagInput] = useState('');

  const fetchResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('academic_resources').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setResources(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const saveResource = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      if (editingResource) {
        const { error } = await supabase.from('academic_resources').update({
          title: newResource.title,
          category: newResource.category,
          resource_type: newResource.resource_type,
          google_drive_url: newResource.google_drive_url,
          description: newResource.description,
          tags: newResource.tags,
          difficulty_level: newResource.difficulty_level,
          estimated_time: newResource.estimated_time,
          language: newResource.language,
          author: newResource.author,
          publication_year: newResource.publication_year,
          is_featured: newResource.is_featured
        }).eq('id', editingResource);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('academic_resources').insert([{ ...newResource, view_count: 0 }]);
        if (error) throw error;
      }
      await fetchResources(); resetForm();
    } catch (e: any) { alert('Error al guardar: ' + (e?.message||'')); } finally { setLoading(false); }
  };

  const resetForm = () => {
    setNewResource({ title: '', category: 'neuroanatomia', resource_type: 'guia', google_drive_url: '', description: '', tags: [], difficulty_level: 'basico', estimated_time: 30, language: 'es', author: '', publication_year: new Date().getFullYear(), is_featured: false });
    setTagInput(''); setEditingResource(null); setShowForm(false);
  };

  const handleEdit = (r: AcademicResource) => { setNewResource(r); setTagInput(r.tags?.join(', ')||''); setEditingResource(r.id!); setShowForm(true); };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar recurso?')) return;
    setLoading(true);
    try { const { error } = await supabase.from('academic_resources').delete().eq('id', id); if (error) throw error; await fetchResources(); }
    catch (e: any) { alert('Error al eliminar: ' + (e?.message||'')); } finally { setLoading(false); }
  };

  useEffect(()=>{ fetchResources(); },[]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Recursos Educativos</h3>
        {isAdminMode && <button className="px-3 py-1 border rounded" onClick={()=> setShowForm(v=>!v)}>{editingResource? 'Editar':'Nuevo'}</button>}
      </div>

      {showForm && (
        <form onSubmit={saveResource} className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded p-3 my-3">
          <input className="border rounded p-2" placeholder="Titulo" value={newResource.title} onChange={(e)=> setNewResource({...newResource, title:e.target.value})} />
          <input className="border rounded p-2" placeholder="URL (Drive)" value={newResource.google_drive_url} onChange={(e)=> setNewResource({...newResource, google_drive_url:e.target.value})} />
          <select className="border rounded p-2" value={newResource.resource_type} onChange={(e)=> setNewResource({...newResource, resource_type:e.target.value as any})}>
            <option value="guia">Guía</option>
            <option value="paper">Paper</option>
            <option value="video">Video</option>
            <option value="otro">Otro</option>
          </select>
          <input className="border rounded p-2" placeholder="Categoria" value={newResource.category} onChange={(e)=> setNewResource({...newResource, category:e.target.value})} />
          <input className="border rounded p-2 md:col-span-2" placeholder="Descripcion" value={newResource.description} onChange={(e)=> setNewResource({...newResource, description:e.target.value})} />
          <input className="border rounded p-2 md:col-span-2" placeholder="Tags (coma)" value={tagInput} onChange={(e)=> { setTagInput(e.target.value); setNewResource({...newResource, tags: e.target.value.split(',').map(x=> x.trim()).filter(Boolean)}) }} />
          <div className="md:col-span-2 flex gap-2">
            <button className="px-3 py-1 rounded border btn-success" type="submit">Guardar</button>
            <button className="px-3 py-1 rounded border btn-soft" type="button" onClick={resetForm}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {resources.map(r => (
          <div key={r.id} className="border rounded p-3">
            <div className="font-medium">{r.title}</div>
            <div className="text-sm text-gray-600">{r.category} · {r.resource_type}</div>
            {r.google_drive_url && <a href={r.google_drive_url} target="_blank" className="text-blue-700 text-sm">Abrir</a>}
            {isAdminMode && (
              <div className="flex gap-2 mt-2">
                <button className="px-2 py-1 border rounded" onClick={()=> handleEdit(r)}>Editar</button>
                <button className="px-2 py-1 border rounded" onClick={()=> handleDelete(r.id!)}>Eliminar</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

