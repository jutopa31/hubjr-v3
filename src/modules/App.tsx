import React, { useEffect, useState } from 'react'
import WardRounds from './WardRounds'
import PendientesManager from './PendientesManager'
import SimpleCalendar from './SimpleCalendar'
import AcademiaManager from './AcademiaManager'

type Tab = 'pase' | 'pendientes' | 'calendario' | 'academico'

export function App() {
  const [tab, setTab] = useState<Tab>('pase')

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.dataset.section = tab === 'pase' || tab === 'pendientes' ? 'patients' : (tab === 'calendario' ? 'resources' : 'admin')
    }
    return () => { if (typeof document !== 'undefined') delete (document.body as any).dataset.section }
  }, [tab])

  return (
    <div className="min-h-screen">
      <header className="border-b sticky top-0 bg-white z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">HubJR v3 – Modulos Seleccionados</h1>
          <nav className="flex gap-2">
            <button className={`px-3 py-1 rounded border ${tab==='pase'?'bg-accent text-black':'btn-soft'}`} onClick={()=>setTab('pase')}>Pase de sala</button>
            <button className={`px-3 py-1 rounded border ${tab==='pendientes'?'bg-accent text-black':'btn-soft'}`} onClick={()=>setTab('pendientes')}>Pendientes</button>
            <button className={`px-3 py-1 rounded border ${tab==='calendario'?'bg-accent text-black':'btn-soft'}`} onClick={()=>setTab('calendario')}>Calendario</button>
            <button className={`px-3 py-1 rounded border ${tab==='academico'?'bg-accent text-black':'btn-soft'}`} onClick={()=>setTab('academico')}>Academico</button>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4">
        {tab==='pase' && <WardRounds />}
        {tab==='pendientes' && <PendientesManager />}
        {tab==='calendario' && <SimpleCalendar />}
        {tab==='academico' && <AcademiaManager />}
      </main>
    </div>
  )
}

