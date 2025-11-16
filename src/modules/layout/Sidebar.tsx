import React, { useState } from 'react'
import { Brain, X, Search, ChevronRight, ChevronLeft, Sun, Moon, ClipboardList, CalendarDays, BookOpen, Activity } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface SidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  activeTab: string
  handleTabChange: (tab: string) => void
}

const DEFAULT_MENU: MenuItem[] = [
  { id: 'pase', label: 'Pase de sala', icon: Activity },
  { id: 'pendientes', label: 'Pendientes', icon: ClipboardList },
  { id: 'calendario', label: 'Calendario', icon: CalendarDays },
  { id: 'academico', label: 'Académico', icon: BookOpen },
]

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen, activeTab, handleTabChange }) => {
  const [pinned, setPinned] = useState(false)
  const [hoverExpanded, setHoverExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { theme, toggleTheme } = useTheme()

  const filteredMenuItems = DEFAULT_MENU.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
  const isExpanded = pinned || hoverExpanded

  const toggleSidebar = () => {
    const next = !pinned
    setPinned(next)
    if (!next) setSearchQuery('')
  }

  return (
    <>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 bg-white dark:bg-[#171717] shadow-2xl flex flex-col transition-all duration-200 ease-in-out ${isExpanded ? 'w-56' : 'w-14'}`}
           onMouseEnter={()=> setHoverExpanded(true)} onMouseLeave={()=> setHoverExpanded(false)}>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-200 z-10">
          <X className="h-4 w-4" />
        </button>

        <button onClick={toggleSidebar} className="hidden lg:flex absolute -right-3 top-5 bg-gray-100 dark:bg-[#2a2a2a] border border-gray-300 dark:border-gray-700 rounded-full p-1 hover:bg-gray-200 dark:hover:bg-[#3a3a3a] transition-colors z-10 shadow-lg" title={pinned ? 'Colapsar (desanclar)' : 'Expandir (anclar)'}>
          {pinned ? (<ChevronLeft className="h-3 w-3 text-gray-600 dark:text-gray-300" />) : (<ChevronRight className="h-3 w-3 text-gray-600 dark:text-gray-300" />)}
        </button>

        <div className="p-2.5 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Brain className="text-blue-500 flex-shrink-0 h-4 w-4" />
            {isExpanded && (
              <div className="overflow-hidden">
                <h1 className="font-semibold text-xs text-gray-900 dark:text-white whitespace-nowrap">Neurología</h1>
              </div>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="p-2 border-b border-gray-200 dark:border-gray-800 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-500" />
              <input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-7 pr-2 py-1 text-xs bg-gray-50 dark:bg-[#2a2a2a] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
            </div>
          </div>
        )}

        <nav className="flex-1 p-2 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <ul className="space-y-1">
            {filteredMenuItems.length > 0 ? (
              filteredMenuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <li key={item.id} className="relative group">
                    <button onClick={() => handleTabChange(item.id)} title={!isExpanded ? item.label : undefined} className={`w-full flex items-center px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${isActive ? 'bg-gray-200 dark:bg-[#2a2a2a] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#212121] hover:text-gray-900 dark:hover:text-gray-200'} ${!isExpanded ? 'justify-center' : 'space-x-2'}`}>
                      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                      {isExpanded && (<span className="flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>)}
                    </button>
                  </li>
                )
              })
            ) : (
              <li className="px-2 py-1.5 text-xs text-gray-500 text-center">Sin resultados</li>
            )}
          </ul>
        </nav>

        <div className="border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
          <button onClick={toggleTheme} className={`w-full flex items-center px-2 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#212121] hover:text-gray-900 dark:hover:text-gray-200 transition-colors ${!isExpanded ? 'justify-center' : 'space-x-2'}`} title={isExpanded ? undefined : (theme === 'dark' ? 'Modo claro' : 'Modo oscuro')}>
            {theme === 'dark' ? (<><Sun className="h-3.5 w-3.5 flex-shrink-0" />{isExpanded && <span>Modo Claro</span>}</>) : (<><Moon className="h-3.5 w-3.5 flex-shrink-0" />{isExpanded && <span>Modo Oscuro</span>}</>)}
          </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar
