/**
 * Authenticated shell: persistent sidebar, top bar with breadcrumbs and the
 * routed page content. Breadcrumb labels come from the navigation tree so they
 * match the sidebar wording exactly.
 */
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../context/AuthContext'
import { humanise } from '../utils/formatters'

function useBreadcrumbs(navigation) {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)
  const crumbs = [{ label: 'Home' }]

  const moduleDef = navigation?.modules?.find((item) => item.key === segments[1])

  if (segments[0] === 'm') {
    crumbs.push({ label: moduleDef?.name || humanise(segments[1] || '') })
    if (segments[2]) {
      const submodule = moduleDef?.submodules?.find((item) => item.key === segments[2])
      crumbs.push({ label: submodule?.name || humanise(segments[2]) })
    }
  } else if (segments[0] === 'reports') {
    crumbs.push({ label: moduleDef?.name || humanise(segments[1] || 'Reports') })
    if (segments[2]) {
      const page = moduleDef?.pages?.find((item) => item.key === segments[2])
      crumbs.push({ label: page?.name || humanise(segments[2]) })
    }
  } else if (segments[0]) {
    crumbs.push({ label: humanise(segments[0]) })
  }

  return crumbs
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, navigation } = useAuth()
  const crumbs = useBreadcrumbs(navigation)

  return (
    <div className="flex h-full bg-slate-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>
            <nav className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
              {crumbs.map((crumb, index) => (
                <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                  {index > 0 && <span className="text-slate-300">/</span>}
                  <span className={index === crumbs.length - 1 ? 'font-medium text-slate-700' : ''}>{crumb.label}</span>
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:block">
              {user?.isSuperAdmin ? 'Super Admin' : user?.roles?.[0]?.name || 'User'}
            </span>
            <button type="button" onClick={logout} className="btn-secondary">
              Sign out
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
