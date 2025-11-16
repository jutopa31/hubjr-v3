import React, { useEffect, useState } from 'react'
import WardRounds from './WardRounds'
import PendientesManager from './PendientesManager'
import SimpleCalendar from './SimpleCalendar'
import AcademiaManager from './AcademiaManager'
import Sidebar from './layout/Sidebar'

type Tab = 'pase' | 'pendientes' | 'calendario' | 'academico'

export function App() {
  const [tab, setTab] = useState<Tab>('pase')

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.dataset.section = tab === 'pase' || tab === 'pendientes' ? 'patients' : (tab === 'calendario' ? 'resources' : 'admin')
    }
    return () => { if (typeof document !== 'undefined') delete (document.body as any).dataset.section }
  }, [tab])

  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={tab}
        handleTabChange={(t)=>{ setTab(t as Tab); setSidebarOpen(false); }}
      />
      <div className="flex-1 min-w-0">
        <header className="border-b sticky top-0 bg-white z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <button className="lg:hidden px-2 py-1 border rounded" onClick={()=> setSidebarOpen(true)}>Menu</button>
            <h1 className="text-lg font-semibold">HubJR v3 – Modulos</h1>
            <div />
          </div>
        </header>
        <main className="p-4 max-w-7xl mx-auto">
          {tab==='pase' && <WardRounds />}
          {tab==='pendientes' && <PendientesManager />}
          {tab==='calendario' && <SimpleCalendar />}
          {tab==='academico' && <AcademiaManager />}
        </main>
      </div>
    </div>
  )
}
