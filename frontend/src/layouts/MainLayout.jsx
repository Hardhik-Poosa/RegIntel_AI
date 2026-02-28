import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

/**
 * Root layout for authenticated pages.
 * Renders a fixed sidebar + a scrollable main content area.
 */
export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="rg-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="rg-main">
        <Navbar onMenuClick={() => setSidebarOpen((v) => !v)} />
        <main className="rg-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
