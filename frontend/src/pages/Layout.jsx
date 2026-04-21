import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && window.innerWidth < 768 && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex md:relative md:z-auto transition-all duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:w-0 md:border-none md:overflow-hidden'
        )}
      >
        <div className="w-64 h-full flex-shrink-0">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile topbar */}
        <div className="flex items-center gap-2 px-4 h-12 border-b md:hidden flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md hover:bg-accent"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm">Study AI</span>
        </div>

        <div className="flex-1 overflow-hidden">
          <Outlet context={{ setSidebarOpen, sidebarOpen }} />
        </div>
      </main>
    </div>
  )
}
